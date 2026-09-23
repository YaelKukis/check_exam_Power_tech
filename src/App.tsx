import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Award,
  Upload,
  RefreshCw,
  Sparkles,
  BookOpen,
  Check,
  AlertCircle,
  Key,
  X,
  Loader2,
} from 'lucide-react';
import { SAMPLE_PAGES } from './data/sampleExams';
import { ExamPageData, WordToken, SyntaxErrorItem } from './types';
import { ExamViewer } from './components/ExamViewer';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { GradingDashboard } from './components/GradingDashboard';
import { UploadModal } from './components/UploadModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { computeGrade } from './utils/pythonValidator';

export default function App() {
  // Current active page (default: Page 2 Valid Parentheses)
  const [currentPage, setCurrentPage] = useState<ExamPageData>(SAMPLE_PAGES[0]);
  const [uploadedExams, setUploadedExams] = useState<ExamPageData[]>([]);
  const [activeTab, setActiveTab] = useState<'code' | 'grade'>('code');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [hasServerApiKey, setHasServerApiKey] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check server configuration for API key
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasApiKey) {
          setHasServerApiKey(true);
        }
      })
      .catch((e) => console.warn('Could not check server config:', e));
  }, []);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Switch between sample pages or uploaded exams
  const handleSelectPage = (pageId: string) => {
    const sample = SAMPLE_PAGES.find((p) => p.id === pageId);
    if (sample) {
      setCurrentPage({ ...sample });
      showNotification(`Loaded ${sample.title}`);
      return;
    }

    const uploaded = uploadedExams.find((p) => p.id === pageId);
    if (uploaded) {
      setCurrentPage({ ...uploaded });
      showNotification(`Loaded ${uploaded.title}`);
    }
  };

  const handleDeleteUploadedExam = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = uploadedExams.filter((p) => p.id !== pageId);
    setUploadedExams(remaining);
    if (currentPage.id === pageId) {
      setCurrentPage(remaining.length > 0 ? remaining[remaining.length - 1] : SAMPLE_PAGES[0]);
    }
    showNotification('Uploaded exam removed.');
  };

  // Save API key to localStorage and server
  const handleSaveApiKey = async (newKey: string): Promise<boolean> => {
    try {
      localStorage.setItem('gemini_api_key', newKey);
      setApiKey(newKey);

      if (newKey) {
        const res = await fetch('/api/config-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: newKey }),
        });

        if (res.ok) {
          setHasServerApiKey(true);
          // If current page is an uploaded exam that hasn't been graded by AI yet, run OCR!
          if (currentPage.id.startsWith('upload-') && currentPage.tokens.length === 0) {
            setTimeout(() => {
              runOcrOnExam(currentPage, newKey);
            }, 300);
          }
          return true;
        }
      } else {
        setHasServerApiKey(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Run Gemini OCR on a specific page
  const runOcrOnExam = async (pageToGrade: ExamPageData, explicitKey?: string) => {
    const activeKey = explicitKey || apiKey;
    setOcrError(null);
    setIsProcessingOcr(true);
    showNotification(`Analyzing ${pageToGrade.title} with Gemini AI...`);

    try {
      const response = await fetch('/api/ocr-and-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeKey ? { 'X-Gemini-API-Key': activeKey } : {}),
        },
        body: JSON.stringify({
          imageBase64: pageToGrade.imageUrl,
          problemContext: pageToGrade.title,
          apiKey: activeKey || undefined,
          isSample: pageToGrade.id.startsWith('page-'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'NO_API_KEY') {
          setIsApiKeyOpen(true);
          setOcrError('A Google Gemini API Key is required to analyze custom uploaded handwritten exams.');
          showNotification('Please enter a Gemini API Key to enable handwriting AI OCR.');
          return;
        }
        throw new Error(data.message || data.error || 'Failed to process exam');
      }

      const updatedPage: ExamPageData = {
        ...pageToGrade,
        title: data.problemTitle || pageToGrade.title,
        tokens: data.tokens || [],
        pythonCode: data.pythonCode || pageToGrade.pythonCode,
        evaluation: data.evaluation,
      };

      setCurrentPage(updatedPage);

      // Also persist in uploadedExams list if it is an uploaded exam
      setUploadedExams((prev) =>
        prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
      );

      showNotification(`Exam graded successfully: score ${data.evaluation.totalScore}/100!`);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError(err.message || 'Error processing OCR with Gemini AI.');
      showNotification(`OCR Error: ${err.message || 'Failed'}`);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // Run OCR on current active image
  const handleRunOcr = () => {
    runOcrOnExam(currentPage);
  };

  // Re-grade when code is edited manually
  const handleCodeChange = (newCode: string) => {
    const updatedEval = computeGrade(
      newCode,
      /isValid/i.test(newCode)
        ? 'valid_parentheses'
        : /revesList|reverseList/i.test(newCode)
        ? 'reverse_linked_list'
        : 'general',
      currentPage.evaluation.studentName,
      currentPage.evaluation.studentEmail
    );

    const updatedPage: ExamPageData = {
      ...currentPage,
      pythonCode: newCode,
      evaluation: updatedEval,
    };

    setCurrentPage(updatedPage);
    setUploadedExams((prev) =>
      prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
    );
  };

  // "Help OCR": update a recognized word token
  const handleUpdateToken = (tokenId: string, newWord: string) => {
    const oldToken = currentPage.tokens.find((t) => t.id === tokenId);
    if (!oldToken) return;

    const oldWord = oldToken.word;
    const updatedTokens = currentPage.tokens.map((t) =>
      t.id === tokenId ? { ...t, word: newWord, confidence: 1.0, isCustom: true } : t
    );

    // Also update python code if the word matches
    let updatedCode = currentPage.pythonCode;
    if (oldWord && updatedCode.includes(oldWord)) {
      updatedCode = updatedCode.replace(oldWord, newWord);
    }

    const updatedEval = computeGrade(
      updatedCode,
      /isValid/i.test(updatedCode)
        ? 'valid_parentheses'
        : /revesList|reverseList/i.test(updatedCode)
        ? 'reverse_linked_list'
        : 'general',
      currentPage.evaluation.studentName,
      currentPage.evaluation.studentEmail
    );

    const updatedPage: ExamPageData = {
      ...currentPage,
      tokens: updatedTokens,
      pythonCode: updatedCode,
      evaluation: updatedEval,
    };

    setCurrentPage(updatedPage);
    setUploadedExams((prev) =>
      prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
    );

    showNotification(`Updated token: "${oldWord}" -> "${newWord}"`);
  };

  // Delete a token box
  const handleDeleteToken = (tokenId: string) => {
    const updatedPage: ExamPageData = {
      ...currentPage,
      tokens: currentPage.tokens.filter((t) => t.id !== tokenId),
    };
    setCurrentPage(updatedPage);
    setUploadedExams((prev) =>
      prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
    );
    showNotification('Bounding box removed.');
  };

  // Add a newly drawn token box
  const handleAddToken = (newToken: WordToken) => {
    const updatedPage: ExamPageData = {
      ...currentPage,
      tokens: [...currentPage.tokens, newToken],
    };
    setCurrentPage(updatedPage);
    setUploadedExams((prev) =>
      prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
    );
    showNotification(`Added word: "${newToken.word}"`);
  };

  // Handle uploaded exam file (PDF or image)
  const handleExamLoaded = (
    dataUrl: string,
    title: string,
    _pageCount?: number,
    extractedText?: string,
    extractedTokens?: WordToken[]
  ) => {
    const cleanTitle = title.replace(/\.[^/.]+$/, '');

    // Case 1: PDF has digital text extracted directly by PDF reader
    if (extractedText && extractedText.trim().length > 15) {
      const initialGrade = computeGrade(extractedText, 'general', 'Student', '');
      const newPage: ExamPageData = {
        id: `upload-${Date.now()}`,
        pageNumber: 1,
        title: cleanTitle,
        imageUrl: dataUrl,
        tokens: extractedTokens || [],
        pythonCode: extractedText,
        evaluation: initialGrade,
      };

      setUploadedExams((prev) => [...prev, newPage]);
      setCurrentPage(newPage);
      showNotification(`Extracted code & graded ${cleanTitle}!`);
      return;
    }

    // Case 2: Scanned image or handwritten exam
    const initialGrade = computeGrade('# Student Exam Submission\n', 'general', 'Student', '');
    const newPage: ExamPageData = {
      id: `upload-${Date.now()}`,
      pageNumber: 1,
      title: cleanTitle,
      imageUrl: dataUrl,
      tokens: [],
      pythonCode: `# Uploaded Exam: ${cleanTitle}\n# Click "Run OCR & Grade" or add API key to transcribe\n`,
      evaluation: initialGrade,
    };

    setUploadedExams((prev) => [...prev, newPage]);
    setCurrentPage(newPage);

    if (apiKey || hasServerApiKey) {
      runOcrOnExam(newPage);
    } else {
      setIsApiKeyOpen(true);
      showNotification(`Loaded ${cleanTitle}. Connect Gemini API key for handwriting AI OCR.`);
    }
  };

  // Quick fix for a specific syntax deduction
  const handleApplySyntaxFix = (fix: SyntaxErrorItem) => {
    let updated = currentPage.pythonCode;
    if (fix.id.includes('retur')) {
      updated = updated.replace(/\bretur\b/g, 'return');
    } else if (fix.id.includes('sol')) {
      updated = updated.replace(/\bclass\s+solution\s*:/g, 'class Solution:');
    } else if (fix.id.includes('reves')) {
      updated = updated.replace(/\brevesList\b/g, 'reverseList');
    } else if (fix.id.includes('hot')) {
      updated = updated.replace(/\bhot\s+None\b/g, 'not None');
    } else if (fix.id.includes('colon') && fix.codeSnippet) {
      updated = updated.replace(fix.codeSnippet, `${fix.codeSnippet}:`);
    }

    handleCodeChange(updated);
    showNotification(`Fixed: ${fix.error} (+1 point recovered!)`);
  };

  // Quick fix all recognized typos
  const handleAutoFixAll = () => {
    let updated = currentPage.pythonCode;
    updated = updated.replace(/\bretur\b(?!\w)/g, 'return');
    updated = updated.replace(/\bclass\s+solution\s*:/g, 'class Solution:');
    updated = updated.replace(/\brevesList\b/g, 'reverseList');
    updated = updated.replace(/\bhot\s+None\b/g, 'not None');

    handleCodeChange(updated);
    showNotification('Applied all OCR and syntax fixes! Code re-graded.');
  };

  const isConnected = !!(apiKey || hasServerApiKey);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>ExamGrader AI</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  OCR & Exam Checker
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center text-xs text-slate-400 pl-4 border-l border-slate-800 gap-1.5 max-w-sm truncate">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="shrink-0">Problem: </span>
            <span className="font-semibold text-slate-200 truncate">
              {currentPage.evaluation?.problemTitle || currentPage.title}
            </span>
          </div>
        </div>

        {/* Exam Sample Selector, API Key & Upload Action */}
        <div className="flex items-center gap-2">
          {/* Quick Exam Page Pills */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs max-w-md overflow-x-auto">
            <button
              onClick={() => handleSelectPage('page-2-valid-parentheses')}
              className={`px-3 py-1 rounded-md transition-all font-medium shrink-0 ${
                currentPage.id === 'page-2-valid-parentheses'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Page 2: Parentheses
            </button>
            <button
              onClick={() => handleSelectPage('page-1-reverse-linked-list')}
              className={`px-3 py-1 rounded-md transition-all font-medium shrink-0 ${
                currentPage.id === 'page-1-reverse-linked-list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Page 1: Reverse List
            </button>
            {uploadedExams.map((up) => (
              <div
                key={up.id}
                onClick={() => handleSelectPage(up.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer shrink-0 ${
                  currentPage.id === up.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="max-w-[100px] truncate">{up.title}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteUploadedExam(up.id, e)}
                  className="text-slate-400 hover:text-rose-300 ml-0.5"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Gemini API Key Button */}
          <button
            onClick={() => setIsApiKeyOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isConnected
                ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 shadow-sm shadow-amber-500/10'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">
              {isConnected ? 'Gemini AI' : 'Set API Key'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload PDF / Image</span>
          </button>

          {/* Run OCR & Grade */}
          <button
            onClick={handleRunOcr}
            disabled={isProcessingOcr}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessingOcr ? 'animate-spin' : ''}`} />
            <span>{isProcessingOcr ? 'Analyzing...' : 'Run OCR & Grade'}</span>
          </button>
        </div>
      </header>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="absolute top-16 right-6 z-50 bg-indigo-950/95 border border-indigo-500/50 text-indigo-100 text-xs px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3 relative">
        {/* Fullscreen OCR Processing Overlay */}
        {isProcessingOcr && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Analyzing Handwritten Exam with Gemini AI...
            </h3>
            <p className="text-xs text-slate-300 max-w-sm">
              Detecting handwritten word tokens, coordinates, Python syntax, and running algorithmic logic test cases.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-indigo-300 bg-indigo-950/80 px-4 py-2 rounded-full border border-indigo-700/60 shadow-lg">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Exam Checker in progress...</span>
            </div>
          </div>
        )}

        {/* Left Side: Handwritten Exam OCR Image Viewer with Word Bounding Boxes */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col">
          <ExamViewer
            imageUrl={currentPage.imageUrl}
            tokens={currentPage.tokens}
            onUpdateToken={handleUpdateToken}
            onDeleteToken={handleDeleteToken}
            onAddToken={handleAddToken}
            activeLineIndex={hoveredLineIndex}
            onHoverToken={(idx) => setHoveredLineIndex(idx)}
          />
        </div>

        {/* Right Side: Python Code and Grade & Rubric */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col">
          {/* OCR Error Notice if any */}
          {ocrError && (
            <div className="mb-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{ocrError}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyOpen(true)}
                className="underline font-semibold hover:text-rose-200 ml-2 shrink-0"
              >
                Set Key
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Python Code (.py)</span>
              </button>

              <button
                onClick={() => setActiveTab('grade')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === 'grade'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Grade & Rubric ({currentPage.evaluation.totalScore}/100)</span>
              </button>
            </div>

            {/* Quick Score Glance */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Score:</span>
              <span
                className={`font-bold font-mono px-2 py-0.5 rounded ${
                  currentPage.evaluation.totalScore >= 90
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {currentPage.evaluation.totalScore} / 100
              </span>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' ? (
              <PythonCodeViewer
                code={currentPage.pythonCode}
                onChangeCode={handleCodeChange}
                syntaxErrors={currentPage.evaluation.syntaxErrors}
                onReGrade={() => handleCodeChange(currentPage.pythonCode)}
                activeLineIndex={hoveredLineIndex}
                onHoverLine={(idx) => setHoveredLineIndex(idx)}
              />
            ) : (
              <GradingDashboard
                evaluation={currentPage.evaluation}
                onApplySyntaxFix={handleApplySyntaxFix}
                onAutoFixAll={handleAutoFixAll}
              />
            )}
          </div>
        </div>
      </div>

      {/* PDF / Image Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onExamLoaded={handleExamLoaded}
        hasApiKey={isConnected}
        onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
      />

      {/* Gemini AI Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        currentApiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        hasServerApiKey={hasServerApiKey}
      />
    </div>
  );
}
