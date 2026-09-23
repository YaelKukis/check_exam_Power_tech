import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { computeGrade } from './src/utils/pythonValidator.ts';
import { PAGE_2_TOKENS, PAGE_2_CODE } from './src/data/sampleExams.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import fs from 'fs';

// Helper to get GoogleGenAI client if API key is present
function getGeminiClient(explicitKey?: string): GoogleGenAI | null {
  const apiKey = explicitKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// GET /api/config - check if Gemini API key is configured
app.get('/api/config', (_req, res) => {
  const hasKey = !!getGeminiClient();
  return res.json({
    hasApiKey: hasKey,
    model: 'gemini-3.8-flash',
  });
});

// POST /api/config-key - save API key to server and update .env
app.post('/api/config-key', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const trimmed = apiKey.trim();
    process.env.GEMINI_API_KEY = trimmed;

    // Update .env file if it exists
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY="${trimmed}"`);
      } else {
        content += `\nGEMINI_API_KEY="${trimmed}"\n`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }

    return res.json({ success: true, hasApiKey: true });
  } catch (err: any) {
    console.error('Error saving API key:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Helper to call Gemini with automatic model fallback and 503 retry
async function callGemini(ai: GoogleGenAI, mimeType: string, cleanBase64: string, promptText: string, schema: any) {
  // Use currently available Gemini models (gemini-2.x is deprecated by Google)
  const models = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: mimeType || 'image/png',
                data: cleanBase64,
              },
            },
            { text: promptText },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        return { response, usedModel: model };
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`Model ${model} (attempt ${attempt + 1}) failed:`, errMsg);
        lastError = err;

        // If it's a temporary 503 (high demand), pause briefly and retry once
        if (errMsg.includes('503') || errMsg.includes('high demand')) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          // If model is not found / deprecated, immediately break to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// POST /api/ocr-and-grade
app.post('/api/ocr-and-grade', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', problemContext, apiKey, isSample } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    const ai = getGeminiClient(apiKey || (req.headers['x-gemini-api-key'] as string));

    if (!ai) {
      // If it is explicitly a sample page request, allow local mock
      if (isSample) {
        const isLL = /reves|ListNode|head/i.test(problemContext || '');
        const defaultCode = isLL
          ? `# Student: Esti Toledano\n# Email: Esti.Toledano@grunitech.com\n\nclass solution:\n    def revesList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev = None\n        curr = head\n        while curr is not None:\n            next_node = curr.next\n            curr.next = prev\n            prev = curr\n            curr = next_node\n        return prev\n`
          : PAGE_2_CODE;

        const evalResult = computeGrade(
          defaultCode,
          isLL ? 'reverse_linked_list' : 'valid_parentheses',
          'Esti Toledano',
          'Esti.Toledano@grunitech.com'
        );

        return res.json({
          studentName: 'Esti Toledano',
          studentEmail: 'Esti.Toledano@grunitech.com',
          problemTitle: isLL ? 'Reverse Linked List (LeetCode #206)' : 'Valid Parentheses (LeetCode #20)',
          pythonCode: defaultCode,
          tokens: PAGE_2_TOKENS,
          evaluation: evalResult,
          source: 'local_engine',
        });
      }

      // For user-uploaded exams: DO NOT fake Page 2! Tell the user that API key is needed for handwriting OCR
      return res.status(400).json({
        error: 'NO_API_KEY',
        message: 'A Google Gemini API Key is required to analyze and transcribe custom handwritten exams with AI. Please set your API key in the top navigation bar.',
      });
    }

    // Call Gemini with word-level bounding boxes and grading
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const promptText = `
You are an expert OCR and Computer Science programming exam checker.
Analyze this handwritten or typed exam paper.

Instructions:
1. Detect each word and code token with its bounding box [ymin, xmin, ymax, xmax] in normalized coordinates from 0 to 1000.
2. Note any scratched-out words with "isStrikethrough: true" so they can be visually distinguished.
3. Extract the clean, complete Python code as written by the student.
4. Extract student name and email if present on the sheet (otherwise leave empty or "Student").
5. Identify the problem title or question.
6. Check correctness and grade the solution fairly:
   - Rule: "Don't be harsh, reduce 1 point for syntax error and reduce more points for logic error."
   - Examples of 1 point syntax errors: small typo in keyword (e.g., 'retur' instead of 'return', 'revesList' instead of 'reverseList', 'class solution' instead of 'class Solution', missing colon).
   - Logic errors: Check if the algorithm works for edge cases (empty input, brackets closed in right order, termination).
   - Provide a total score out of 100, itemized syntax errors (-1 pt each), logic errors (if any), and test cases (at least 2-4 test cases).
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        studentName: { type: Type.STRING },
        studentEmail: { type: Type.STRING },
        problemTitle: { type: Type.STRING },
        pythonCode: { type: Type.STRING },
        tokens: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              word: { type: Type.STRING },
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER },
              lineIndex: { type: Type.NUMBER },
              isStrikethrough: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
            },
            required: ['id', 'word', 'ymin', 'xmin', 'ymax', 'xmax'],
          },
        },
        totalScore: { type: Type.NUMBER },
        overallFeedback: { type: Type.STRING },
        syntaxErrors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              line: { type: Type.NUMBER },
              codeSnippet: { type: Type.STRING },
              error: { type: Type.STRING },
              penalty: { type: Type.NUMBER },
              suggestion: { type: Type.STRING },
            },
            required: ['id', 'error', 'penalty'],
          },
        },
        logicErrors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              description: { type: Type.STRING },
              penalty: { type: Type.NUMBER },
              severity: { type: Type.STRING },
              suggestion: { type: Type.STRING },
            },
            required: ['id', 'description', 'penalty'],
          },
        },
        testCases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              input: { type: Type.STRING },
              expected: { type: Type.STRING },
              actual: { type: Type.STRING },
              passed: { type: Type.BOOLEAN },
              notes: { type: Type.STRING },
            },
            required: ['id', 'input', 'expected', 'actual', 'passed'],
          },
        },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['pythonCode', 'tokens', 'totalScore'],
    };

    const { response, usedModel } = await callGemini(ai, mimeType, cleanBase64, promptText, schema);

    const parsed = JSON.parse(response.text || '{}');

    // Format tokens to expected schema
    const formattedTokens = (parsed.tokens || []).map((t: any, idx: number) => ({
      id: t.id || `tok-${idx}`,
      word: t.word,
      box: {
        ymin: t.ymin,
        xmin: t.xmin,
        ymax: t.ymax,
        xmax: t.xmax,
      },
      lineIndex: t.lineIndex ?? 0,
      confidence: t.confidence ?? 0.98,
      isStrikethrough: !!t.isStrikethrough,
    }));

    const pythonCode = parsed.pythonCode || '# No code extracted from image\n';
    const studentName = parsed.studentName || 'Student';
    const studentEmail = parsed.studentEmail || '';
    const problemTitle = parsed.problemTitle || problemContext || 'Exam Problem';

    // Compute base grade locally
    const computed = computeGrade(
      pythonCode,
      /isValid/i.test(pythonCode) ? 'valid_parentheses' : /revesList|reverseList/i.test(pythonCode) ? 'reverse_linked_list' : 'general',
      studentName,
      studentEmail
    );

    // Merge model feedback
    if (parsed.syntaxErrors && parsed.syntaxErrors.length > 0) {
      computed.syntaxErrors = parsed.syntaxErrors;
    }
    if (parsed.logicErrors && parsed.logicErrors.length > 0) {
      computed.logicErrors = parsed.logicErrors;
    }
    if (parsed.testCases && parsed.testCases.length > 0) {
      computed.testCases = parsed.testCases;
    }
    if (parsed.totalScore !== undefined) {
      computed.totalScore = parsed.totalScore;
    }
    if (parsed.overallFeedback) {
      computed.overallFeedback = parsed.overallFeedback;
    }
    if (parsed.strengths && parsed.strengths.length > 0) {
      computed.strengths = parsed.strengths;
    }
    if (parsed.recommendations && parsed.recommendations.length > 0) {
      computed.recommendations = parsed.recommendations;
    }
    computed.problemTitle = problemTitle;
    computed.studentName = studentName;
    computed.studentEmail = studentEmail;

    return res.json({
      studentName,
      studentEmail,
      problemTitle,
      pythonCode,
      tokens: formattedTokens,
      evaluation: computed,
      source: usedModel,
    });
  } catch (err: any) {
    console.error('Error in /api/ocr-and-grade:', err);
    return res.status(500).json({
      error: 'OCR_FAILED',
      message: err.message || 'Failed to process handwritten exam with Gemini AI.',
    });
  }
});

// POST /api/re-grade
app.post('/api/re-grade', (req, res) => {
  try {
    const { code, studentName, studentEmail, problemType } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const evaluation = computeGrade(
      code,
      problemType || (/isValid/i.test(code) ? 'valid_parentheses' : 'reverse_linked_list'),
      studentName || 'Esti Toledano',
      studentEmail || 'Esti.Toledano@grunitech.com'
    );

    return res.json({ evaluation });
  } catch (err: any) {
    console.error('Error in /api/re-grade:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ExamGrader server running on port ${PORT}`);
  });
}

startServer();
