// PDF parsing utility using pdfjs-dist or fallback image rendering

import { WordToken } from '../types';

export interface RenderedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  extractedText?: string;
  extractedTokens?: WordToken[];
}

export async function renderPdfToImages(file: File): Promise<RenderedPdfPage[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pages: RenderedPdfPage[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for high crisp OCR quality

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Attempt to extract digital text and bounding boxes if present
      let extractedText = '';
      const extractedTokens: WordToken[] = [];

      try {
        const textContent = await page.getTextContent();
        let tokCounter = 1;
        let lineIdx = 0;
        let lastY: number | null = null;

        for (const rawItem of textContent.items as any[]) {
          const itemText = (rawItem.str || '').trim();
          if (!itemText) continue;

          const tx = rawItem.transform[4];
          const ty = rawItem.transform[5];
          const tw = rawItem.width || 20;
          const th = rawItem.height || 12;

          if (lastY !== null && Math.abs(ty - lastY) > 8) {
            extractedText += '\n';
            lineIdx++;
          } else if (extractedText.length > 0 && !extractedText.endsWith('\n')) {
            extractedText += ' ';
          }
          extractedText += rawItem.str;
          lastY = ty;

          const words = itemText.split(/\s+/).filter(Boolean);
          const wordWidth = tw / Math.max(1, words.length);

          words.forEach((w: string, wIdx: number) => {
            const wX = tx + wIdx * wordWidth;
            const ymin = Math.max(0, Math.min(1000, Math.round(((viewport.height - ty - th) / viewport.height) * 1000)));
            const ymax = Math.max(0, Math.min(1000, Math.round(((viewport.height - ty) / viewport.height) * 1000)));
            const xmin = Math.max(0, Math.min(1000, Math.round((wX / viewport.width) * 1000)));
            const xmax = Math.max(0, Math.min(1000, Math.round(((wX + wordWidth) / viewport.width) * 1000)));

            extractedTokens.push({
              id: `pdf-p${pageNum}-t${tokCounter++}`,
              word: w,
              box: { ymin, xmin, ymax, xmax },
              lineIndex: lineIdx,
              confidence: 1.0,
            });
          });
        }
      } catch (textErr) {
        console.warn('Could not extract text layer from PDF page:', textErr);
      }

      if (context) {
        // White paper background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // @ts-ignore
        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        pages.push({
          pageNumber: pageNum,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
          extractedText: extractedText.trim() ? extractedText : undefined,
          extractedTokens: extractedTokens.length > 0 ? extractedTokens : undefined,
        });
      }
    }

    return pages;
  } catch (err) {
    console.error('Failed to parse PDF with pdfjs-dist:', err);
    throw new Error('Could not parse the PDF file. Please verify it is a valid PDF or try uploading as an image.');
  }
}
