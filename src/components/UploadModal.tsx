import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X, AlertCircle, Loader2 } from 'lucide-react';
import { renderPdfToImages, RenderedPdfPage } from '../utils/pdfReader';

import { WordToken } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamLoaded: (
    dataUrl: string,
    title: string,
    pageCount?: number,
    extractedText?: string,
    extractedTokens?: WordToken[]
  ) => void;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onExamLoaded,
  hasApiKey,
  onOpenApiKeyModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<RenderedPdfPage[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    setPdfPages([]);
    setUploadedFileName(file.name);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Render PDF pages
        const pages = await renderPdfToImages(file);
        if (pages.length === 0) {
          throw new Error('No readable pages found in PDF.');
        }

        if (pages.length === 1) {
          onExamLoaded(
            pages[0].dataUrl,
            file.name,
            1,
            pages[0].extractedText,
            pages[0].extractedTokens
          );
          onClose();
        } else {
          // Allow user to select which page to load
          setPdfPages(pages);
          setLoading(false);
        }
      } else if (file.type.startsWith('image/')) {
        // Direct image
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onExamLoaded(reader.result, file.name, 1);
            onClose();
          }
        };
        reader.onerror = () => {
          setError('Failed to read image file.');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error('Please upload a PDF file or an image (PNG, JPG).');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while reading the exam file.');
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleSelectPage = (page: RenderedPdfPage) => {
    onExamLoaded(
      page.dataUrl,
      `${uploadedFileName} (Page ${page.pageNumber})`,
      pdfPages.length,
      page.extractedText,
      page.extractedTokens
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Upload Exam Document</h3>
            <p className="text-xs text-slate-400">PDF exam sheet or scan image (PNG / JPG)</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Processing exam document pages...</span>
          </div>
        ) : pdfPages.length > 0 ? (
          <div>
            <p className="text-xs text-slate-300 font-medium mb-3">
              Detected {pdfPages.length} pages. Select the handwritten code page to grade:
            </p>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
              {pdfPages.map((p) => (
                <button
                  key={p.pageNumber}
                  onClick={() => handleSelectPage(p)}
                  className="group relative border border-slate-700 hover:border-indigo-500 rounded-lg overflow-hidden bg-slate-950 p-2 text-left transition-all"
                >
                  <img
                    src={p.dataUrl}
                    alt={`Page ${p.pageNumber}`}
                    className="w-full h-32 object-contain bg-white rounded mb-2"
                  />
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>Page {p.pageNumber}</span>
                    <span className="text-indigo-400 group-hover:underline">Select</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex gap-2 text-slate-400 mb-3">
                <FileText className="w-8 h-8 text-indigo-400" />
                <ImageIcon className="w-8 h-8 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-slate-200 mb-1">
                Drop your exam PDF or image here
              </span>
              <span className="text-xs text-slate-500">Supports PDF, PNG, JPG up to 25MB</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Automatic client-side PDF rasterization</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Browse Files
              </button>
            </div>

            {!hasApiKey && onOpenApiKeyModal && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>Tip: Add a free Gemini API key for handwriting AI OCR</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenApiKeyModal();
                  }}
                  className="underline font-semibold hover:text-amber-200"
                >
                  Set Key
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
