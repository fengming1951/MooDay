import React, { useCallback, useRef } from 'react';
import { StickyNote } from '../types';
import StickyEditor from './StickyEditor';
import '../styles/sticky.css';

interface StickyBoardProps {
  stickyNotes: StickyNote[];
  activeStickyId: string | null;
  onCreateSticky: () => void;
  onUpdateSticky: (id: string, updates: Partial<StickyNote>) => void;
  onDeleteSticky: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onFloatSticky: (id: string) => void;
  onSelectSticky: (id: string | null) => void;
}

const GAP = 20;
const COL_COUNT_MIN = 2;

const StickyBoard: React.FC<StickyBoardProps> = ({
  stickyNotes, activeStickyId,
  onCreateSticky, onUpdateSticky, onDeleteSticky, onTogglePin, onToggleVisibility, onFloatSticky, onSelectSticky,
}) => {
  const visibleNotes = stickyNotes.filter(n => n.isVisible);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((id: string) => {
    onSelectSticky(id);
  }, [onSelectSticky]);

  const handleDragEnd = useCallback(async (id: string, didFloat: boolean) => {
    if (didFloat) {
      onUpdateSticky(id, { isVisible: false });
    }
  }, [onUpdateSticky]);

  const handleAutoArrange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleNotes.length === 0) return;

    const containerWidth = canvas.clientWidth;
    const avgW = visibleNotes.reduce((s, n) => s + n.size.width, 0) / visibleNotes.length;

    const cols = Math.max(COL_COUNT_MIN, Math.floor((containerWidth + GAP) / (avgW + GAP)));
    const colWidth = (containerWidth - GAP * (cols + 1)) / cols;

    const ordered = [...visibleNotes].sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });

    const colHeights = new Array(cols).fill(GAP);

    ordered.forEach((note, i) => {
      const col = i % cols;
      const x = GAP + col * (colWidth + GAP);
      const y = colHeights[col];
      onUpdateSticky(note.id, { position: { x, y } });
      colHeights[col] = y + note.size.height + GAP;
    });
  }, [visibleNotes, onUpdateSticky]);

  return (
    <div className="sticky-board">
      {visibleNotes.length === 0 ? (
        <div className="sticky-board-empty">
          <div className="sticky-board-empty-emoji">📝</div>
          <p className="sticky-board-empty-text">还没有便签，创建一个吧</p>
          <button className="create-sticky-btn" onClick={onCreateSticky}>+ 新建便签</button>
        </div>
      ) : (
        <>
          <div className="sticky-toolbar">
            <button className="toolbar-btn" onClick={onCreateSticky}>+ 新建便签</button>
            <button className="toolbar-btn" onClick={() => visibleNotes.forEach(n => onToggleVisibility(n.id))}>👁 全部隐藏</button>
            <button className="toolbar-btn" onClick={() => visibleNotes.forEach(n => onTogglePin(n.id))}>
              📌 {visibleNotes.some(n => n.isPinned) ? '全部取消置顶' : '全部置顶'}
            </button>
            <button className="toolbar-btn" onClick={handleAutoArrange}>📐 整理</button>
          </div>
          <div className="sticky-canvas" ref={canvasRef}>
            {visibleNotes.map(note => (
              <StickyEditor
                key={note.id}
                note={note}
                isActive={activeStickyId === note.id}
                onUpdate={updates => onUpdateSticky(note.id, updates)}
                onDelete={() => onDeleteSticky(note.id)}
                onTogglePin={() => onTogglePin(note.id)}
                onToggleVisibility={() => onToggleVisibility(note.id)}
                onFloat={() => onFloatSticky(note.id)}
                onSelect={() => onSelectSticky(note.id)}
                onDragStart={() => handleDragStart(note.id)}
                onDragEnd={(didFloat) => handleDragEnd(note.id, didFloat)}
                onContextMenu={(e) => e.preventDefault()}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StickyBoard;
