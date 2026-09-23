import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Tag, Square, Plus, Trash2, Check, X, HelpCircle } from 'lucide-react';
import { WordToken } from '../types';

interface ExamViewerProps {
  imageUrl: string;
  tokens: WordToken[];
  onUpdateToken: (tokenId: string, newWord: string) => void;
  onDeleteToken: (tokenId: string) => void;
  onAddToken: (token: WordToken) => void;
  activeLineIndex?: number | null;
  onHoverToken?: (lineIndex: number | null) => void;
}

export const ExamViewer: React.FC<ExamViewerProps> = ({
  imageUrl,
  tokens,
  onUpdateToken,
  onDeleteToken,
  onAddToken,
  activeLineIndex,
  onHoverToken,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBoxStart, setNewBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [tempBox, setTempBox] = useState<{ ymin: number; xmin: number; ymax: number; xmax: number } | null>(null);
  const [drawModalWord, setDrawModalWord] = useState('');

  // When a token is clicked, open edit mode for that token
  const handleTokenClick = (e: React.MouseEvent, token: WordToken) => {
    e.stopPropagation();
    setSelectedTokenId(token.id);
    setEditWord(token.word);
  };

  const handleSaveEdit = () => {
    if (selectedTokenId && editWord.trim()) {
      onUpdateToken(selectedTokenId, editWord.trim());
      setSelectedTokenId(null);
    }
  };

  // Click & drag on image to create a new bounding box
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;
    setNewBoxStart({ x, y });
    setTempBox({ ymin: y, xmin: x, ymax: y, xmax: x });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !newBoxStart || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const currentY = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));

    setTempBox({
      ymin: Math.min(newBoxStart.y, currentY),
      xmin: Math.min(newBoxStart.x, currentX),
      ymax: Math.max(newBoxStart.y, currentY),
      xmax: Math.max(newBoxStart.x, currentX),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !tempBox) return;
    // Check if box has reasonable size
    if (tempBox.xmax - tempBox.xmin > 10 && tempBox.ymax - tempBox.ymin > 10) {
      // keep tempBox for prompt
    } else {
      setTempBox(null);
      setNewBoxStart(null);
    }
  };

  const handleConfirmNewBox = () => {
    if (tempBox && drawModalWord.trim()) {
      const newToken: WordToken = {
        id: `custom-${Date.now()}`,
        word: drawModalWord.trim(),
        box: tempBox,
        lineIndex: 0,
        confidence: 1.0,
        isCustom: true,
      };
      onAddToken(newToken);
      setTempBox(null);
      setNewBoxStart(null);
      setDrawModalWord('');
      setIsDrawing(false);
    }
  };

  const handleCancelNewBox = () => {
    setTempBox(null);
    setNewBoxStart(null);
    setDrawModalWord('');
    setIsDrawing(false);
  };

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative select-none">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-2 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Exam Sheet OCR Viewer
          </span>
          <span className="text-xs text-slate-500">({tokens.length} words recognized)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
              showLabels ? 'bg-indigo-600/80 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle word text above bounding boxes"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Word Labels</span>
          </button>

          {/* Toggle Boxes */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
              showBoxes ? 'bg-emerald-600/80 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle bounding box outlines"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Boxes</span>
          </button>

          {/* Draw Missing Box Tool */}
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors ${
              isDrawing
                ? 'bg-amber-600 text-white border-amber-400 font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Draw a missing bounding box manually"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isDrawing ? 'Drawing Box...' : 'Add Word Box'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-md p-0.5 border border-slate-700/60">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Instructions Banner when drawing */}
      {isDrawing && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-xs px-4 py-1.5 flex items-center justify-between z-20">
          <span>Click and drag on the handwritten exam sheet to draw a bounding box around any missed word.</span>
          <button onClick={handleCancelNewBox} className="text-amber-300 hover:underline font-semibold ml-2">
            Cancel
          </button>
        </div>
      )}

      {/* Main Image & Overlay Canvas Container */}
      <div
        ref={containerRef}
        onClick={() => setSelectedTokenId(null)}
        className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 relative"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white"
        >
          {/* The Handwritten Sheet Image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Handwritten Exam Sheet"
            className={`block max-w-full h-auto pointer-events-auto ${
              isDrawing ? 'cursor-crosshair' : 'cursor-default'
            }`}
            style={{ width: '850px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />

          {/* Bounding Boxes & Floating Word Badges */}
          {tokens.map((token) => {
            const isHovered = activeLineIndex === token.lineIndex;
            const isSelected = selectedTokenId === token.id;
            const isStrike = token.isStrikethrough;

            // Box coordinate percentages (0 to 1000 converted to 0% to 100%)
            const topPct = token.box.ymin / 10;
            const leftPct = token.box.xmin / 10;
            const widthPct = (token.box.xmax - token.box.xmin) / 10;
            const heightPct = (token.box.ymax - token.box.ymin) / 10;

            return (
              <div
                key={token.id}
                style={{
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
                onClick={(e) => handleTokenClick(e, token)}
                onMouseEnter={() => onHoverToken && onHoverToken(token.lineIndex)}
                onMouseLeave={() => onHoverToken && onHoverToken(null)}
                className={`absolute transition-all duration-150 group cursor-pointer ${
                  !showBoxes && !isSelected && !isHovered ? 'pointer-events-auto' : ''
                }`}
              >
                {/* Bounding Box Outline */}
                {showBoxes && (
                  <div
                    className={`w-full h-full rounded-[2px] transition-all border ${
                      isStrike
                        ? 'border-dashed border-slate-500 bg-slate-500/10'
                        : isSelected
                        ? 'border-2 border-indigo-400 bg-indigo-500/25 ring-2 ring-indigo-400/50 shadow-md'
                        : isHovered
                        ? 'border-2 border-cyan-400 bg-cyan-500/20'
                        : 'border-emerald-600/70 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  />
                )}

                {/* Floating Word Label Recognized ABOVE the Box */}
                {(showLabels || isSelected || isHovered) && (
                  <div
                    style={{
                      transform: 'translateY(-100%)',
                    }}
                    className={`absolute -top-1 left-0 z-10 whitespace-nowrap px-1.5 py-0.5 rounded text-[11px] font-mono font-medium shadow-md transition-all flex items-center gap-1 ${
                      isStrike
                        ? 'bg-slate-800 text-slate-400 line-through border border-slate-600'
                        : isSelected
                        ? 'bg-indigo-600 text-white ring-1 ring-white/60 font-semibold'
                        : isHovered
                        ? 'bg-cyan-600 text-white font-semibold'
                        : 'bg-slate-900/90 text-emerald-300 border border-emerald-500/40 hover:bg-slate-900 hover:text-emerald-200'
                    }`}
                  >
                    <span>{token.word}</span>
                    {isSelected && <span className="text-[9px] text-indigo-200">(Click to edit)</span>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Temporary New Box while user is dragging */}
          {tempBox && isDrawing && (
            <div
              style={{
                top: `${tempBox.ymin / 10}%`,
                left: `${tempBox.xmin / 10}%`,
                width: `${(tempBox.xmax - tempBox.xmin) / 10}%`,
                height: `${(tempBox.ymax - tempBox.ymin) / 10}%`,
              }}
              className="absolute border-2 border-dashed border-amber-400 bg-amber-400/20 pointer-events-none z-30"
            />
          )}
        </div>
      </div>

      {/* Floating Inline Token Edit Modal / Popover */}
      {selectedToken && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/50 rounded-xl p-3.5 shadow-2xl z-40 w-80 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help OCR: Correct Recognized Word</span>
            </div>
            <button
              onClick={() => setSelectedTokenId(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={editWord}
              onChange={(e) => setEditWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setSelectedTokenId(null);
              }}
              autoFocus
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Correct word..."
            />
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={() => {
                onDeleteToken(selectedToken.id);
                setSelectedTokenId(null);
              }}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors"
              title="Delete Box"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Confidence: {Math.round((selectedToken.confidence ?? 0.98) * 100)}%</span>
            <span className="text-slate-500">Press Enter to update</span>
          </div>
        </div>
      )}

      {/* Modal for entering word after drawing a new box */}
      {tempBox && !newBoxStart && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-96 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-1">Add Recognized Word</h4>
            <p className="text-xs text-slate-400 mb-3">
              Type the word or code symbol you drew the bounding box around:
            </p>
            <input
              type="text"
              value={drawModalWord}
              onChange={(e) => setDrawModalWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmNewBox();
                if (e.key === 'Escape') handleCancelNewBox();
              }}
              placeholder="e.g. stack.append(c), return, isValid"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono mb-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelNewBox}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNewBox}
                disabled={!drawModalWord.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                Add Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Footer Tips */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Click any word box to correct or delete OCR results</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Scroll to pan • Use zoom buttons above
        </div>
      </div>
    </div>
  );
};
