import React, { useState } from 'react';
import { Copy, Check, Download, Play, Wand2, FileCode, Edit3, Eye } from 'lucide-react';
import { SyntaxErrorItem } from '../types';

interface PythonCodeViewerProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  syntaxErrors: SyntaxErrorItem[];
  onReGrade: () => void;
  activeLineIndex?: number | null;
  onHoverLine?: (lineIndex: number | null) => void;
}

export const PythonCodeViewer: React.FC<PythonCodeViewerProps> = ({
  code,
  onChangeCode,
  syntaxErrors,
  onReGrade,
  activeLineIndex,
  onHoverLine,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'solution.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAutoFix = () => {
    let fixed = code;
    // Fix 'retur' to 'return'
    fixed = fixed.replace(/\bretur\b(?!\w)/g, 'return');
    // Fix 'class solution:' to 'class Solution:'
    fixed = fixed.replace(/\bclass\s+solution\s*:/g, 'class Solution:');
    // Fix 'hot None' to 'not None'
    fixed = fixed.replace(/\bhot\s+None\b/g, 'not None');
    // Fix 'revesList' to 'reverseList'
    fixed = fixed.replace(/\brevesList\b/g, 'reverseList');

    onChangeCode(fixed);
  };

  const lines = code.split('\n');

  // Syntax highlighting parser
  const renderHighlightedLine = (line: string) => {
    if (!line.trim()) {
      return <span>&nbsp;</span>;
    }

    if (line.trim().startsWith('#')) {
      return <span className="text-slate-500 italic">{line}</span>;
    }

    // Tokenize line using regex
    const tokenRegex = /(\b(?:def|class|return|retur|if|else|elif|while|for|in|is|not|and|or|True|False|None)\b|\b(?:bool|str|int|Optional|ListNode|List)\b|'[^']*'|"[^"]*"|\b(?:isValid|revesList|reverseList|append|pop|len)\b|[{}()\[\]]|==|!=|->|<=|>=|[=+\-*/%:])/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`} className="text-slate-300">
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }

      const val = match[0];
      let colorClass = 'text-slate-200';

      if (['def', 'class', 'return', 'retur', 'if', 'else', 'elif', 'while', 'for', 'in', 'is', 'not', 'and', 'or'].includes(val)) {
        colorClass = val === 'retur' ? 'text-amber-400 underline decoration-wavy decoration-red-500 font-bold' : 'text-purple-400 font-semibold';
      } else if (['True', 'False', 'None'].includes(val)) {
        colorClass = 'text-amber-300 font-medium';
      } else if (['bool', 'str', 'int', 'Optional', 'ListNode', 'List'].includes(val)) {
        colorClass = 'text-emerald-400 font-mono';
      } else if (['isValid', 'revesList', 'reverseList', 'append', 'pop', 'len'].includes(val)) {
        colorClass = 'text-sky-300 font-medium';
      } else if (val.startsWith("'") || val.startsWith('"')) {
        colorClass = 'text-green-400';
      } else if (['{', '}', '(', ')', '[', ']'].includes(val)) {
        colorClass = 'text-cyan-300 font-bold';
      } else if (['==', '!=', '->', ':', '='].includes(val)) {
        colorClass = 'text-pink-400 font-semibold';
      }

      parts.push(
        <span key={`tok-${match.index}`} className={colorClass}>
          {val}
        </span>
      );

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(
        <span key={`txt-end`} className="text-slate-300">
          {line.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Code Editor Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            solution.py <span className="text-slate-600 font-normal">(Python 3)</span>
          </span>
          {syntaxErrors.length > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
              {syntaxErrors.length} syntax {syntaxErrors.length === 1 ? 'issue' : 'issues'} (-{syntaxErrors.length} pt)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
              isEditing
                ? 'bg-indigo-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Edit Mode"
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'View Colors' : 'Edit Code'}</span>
          </button>

          <button
            onClick={handleAutoFix}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 rounded-md transition-colors"
            title="Help client by automatically correcting recognized typos"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Fix Typos</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Copy Python Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Download solution.py"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReGrade}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-sm transition-all"
            title="Re-run checking and grading"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Re-Grade</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="flex-1 overflow-auto font-mono text-sm relative bg-[#0b101b]">
        {isEditing ? (
          <textarea
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm text-slate-200 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            placeholder="Type or edit Python code here..."
            spellCheck={false}
          />
        ) : (
          <div className="py-3 select-text min-w-max">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const errorForLine = syntaxErrors.find((e) => e.line === lineNum);
              const isHovered = activeLineIndex === idx;

              return (
                <div
                  key={`line-${idx}`}
                  onMouseEnter={() => onHoverLine && onHoverLine(idx)}
                  onMouseLeave={() => onHoverLine && onHoverLine(null)}
                  className={`flex items-start group px-4 py-0.5 transition-colors ${
                    errorForLine
                      ? 'bg-amber-950/30 border-l-2 border-amber-500'
                      : isHovered
                      ? 'bg-indigo-950/40 border-l-2 border-indigo-400'
                      : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                  }`}
                >
                  {/* Line Number */}
                  <span className="w-9 pr-3 text-right select-none text-xs text-slate-600 group-hover:text-slate-400 font-mono">
                    {lineNum}
                  </span>

                  {/* Code Line Content */}
                  <div className="flex-1 font-mono leading-relaxed whitespace-pre">
                    {renderHighlightedLine(line)}
                  </div>

                  {/* Error Flag Badge */}
                  {errorForLine && (
                    <div className="ml-3 shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] rounded">
                      <span className="font-semibold text-rose-400">-1 pt</span>
                      <span className="hidden xl:inline text-slate-400 max-w-xs truncate">{errorForLine.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Footer / Quick Info */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>{lines.length} lines</span>
          <span>•</span>
          <span>{code.length} characters</span>
          <span>•</span>
          <span className="text-emerald-400">UTF-8 Python 3</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Tip: Click any bounding box on the left or click "Edit Code" to help fix OCR words!
        </div>
      </div>
    </div>
  );
};
