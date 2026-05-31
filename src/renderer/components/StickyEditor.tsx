import React, { useRef, useCallback, useEffect, useState } from 'react';
import { StickyNote, MOOD_COLORS, MOOD_EMOJIS, MoodType } from '../types';
import MoodPicker from './MoodPicker';

interface StickyEditorProps {
  note: StickyNote;
  isActive: boolean;
  onUpdate: (updates: Partial<StickyNote>) => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleVisibility: () => void;
  onFloat: () => void;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (didFloat: boolean) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const DEAD_ZONE = 3;

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)}\]'"])/g;

const renderContent = (text: string) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = match[0];
    parts.push(
      <span key={match.index} className="sticky-url" onClick={(e) => { e.stopPropagation(); window.electronAPI?.openExternalUrl(url); }} title={url}>{url}</span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
};

const StickyEditor: React.FC<StickyEditorProps> = ({
  note, isActive, onUpdate, onDelete, onTogglePin, onToggleVisibility, onFloat, onSelect, onDragStart, onDragEnd, onContextMenu,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.content);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [floatPreview, setFloatPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    moved: boolean;
    canvasRect: DOMRect;
    baseX: number; baseY: number;
    noteW: number; noteH: number;
    winScreenX: number; winScreenY: number;
    previewCreated: boolean;
  } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const didMove = useRef(false);

  useEffect(() => { setEditText(note.content); }, [note.content]);

  const getMainBoundsViewport = useCallback((): DOMRect | null => {
    const el = noteRef.current?.closest('.app-container');
    return el ? el.getBoundingClientRect() : null;
  }, []);

  const isCenterOutside = useCallback((viewportX: number, viewportY: number, w: number, h: number): boolean => {
    const b = getMainBoundsViewport();
    if (!b) return false;
    const cx = viewportX + w / 2;
    const cy = viewportY + h / 2;
    return cx < b.left || cx > b.right || cy < b.top || cy > b.bottom;
  }, [getMainBoundsViewport]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing) return;
    const target = e.target as HTMLElement;
    if (target.closest('.sticky-header-btn, .sticky-mood-btn, .sticky-resize-handle, .sticky-url, .remove-image-btn, textarea')) return;

    e.preventDefault();
    didMove.current = false;

    const canvasEl = noteRef.current?.closest('.sticky-canvas');
    const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : new DOMRect(0, 0, 9999, 9999);
    const noteW = note.size.width;
    const noteH = note.size.height;
    const baseX = note.position.x;
    const baseY = note.position.y;

    dragRef.current = {
      moved: false,
      canvasRect,
      baseX, baseY,
      noteW, noteH,
      winScreenX: window.screenX ?? 0,
      winScreenY: window.screenY ?? 0,
      previewCreated: false,
    };

    let lastFloatPreview = false;

    const handleMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - e.clientX;
      const dy = me.clientY - e.clientY;

      if (!dragRef.current.moved) {
        if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
        dragRef.current.moved = true;
        didMove.current = true;
        onDragStart();
        setIsDragging(true);
        if (noteRef.current) {
          noteRef.current.style.transition = 'none';
        }
      }

      const { canvasRect: cr, baseX: bx, baseY: by, noteW: nw, noteH: nh, winScreenX: wsx, winScreenY: wsy } = dragRef.current;

      const curViewX = cr.left + bx + dx;
      const curViewY = cr.top + by + dy;

      if (noteRef.current) {
        noteRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      if (!dragRef.current.previewCreated) {
        dragRef.current.previewCreated = true;
        window.electronAPI?.createFloatPreview(note, wsx + cr.left + bx, wsy + cr.top + by);
      }

      const outside = isCenterOutside(curViewX, curViewY, nw, nh);
      if (outside !== lastFloatPreview) {
        lastFloatPreview = outside;
        setFloatPreview(outside);
      }

      window.electronAPI?.moveFloatPreview(wsx + curViewX, wsy + curViewY, outside);
    };

    const handleUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);

      const st = dragRef.current;
      if (st?.moved && noteRef.current) {
        const dx = ue.clientX - e.clientX;
        const dy = ue.clientY - e.clientY;
        const curViewX = st.canvasRect.left + st.baseX + dx;
        const curViewY = st.canvasRect.top + st.baseY + dy;
        const outside = isCenterOutside(curViewX, curViewY, st.noteW, st.noteH);

        noteRef.current.style.transition = '';
        noteRef.current.style.transform = '';
        setIsDragging(false);
        setFloatPreview(false);

        if (outside) {
          window.electronAPI?.finalizeFloatPreview();
          onUpdate({ isVisible: false });
          onDragEnd(true);
        } else {
          window.electronAPI?.destroyFloatPreview();
          onUpdate({ position: { x: Math.max(0, st.baseX + dx), y: Math.max(0, st.baseY + dy) } });
          onDragEnd(false);
        }
      } else {
        setIsDragging(false);
        setFloatPreview(false);
      }
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [note, isEditing, onUpdate, onDragStart, onDragEnd, isCenterOutside]);

  const handleClick = useCallback(() => {
    if (!didMove.current) onSelect();
  }, [onSelect]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: note.size.width, startH: note.size.height };
    const hm = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      onUpdate({ size: { width: Math.max(200, resizeRef.current.startW + me.clientX - resizeRef.current.startX), height: Math.max(160, resizeRef.current.startH + me.clientY - resizeRef.current.startY) } });
    };
    const hu = () => { resizeRef.current = null; document.removeEventListener('mousemove', hm); document.removeEventListener('mouseup', hu); };
    document.addEventListener('mousemove', hm);
    document.addEventListener('mouseup', hu);
  }, [note.size, onUpdate]);

  const handleMoodSelect = useCallback((mood: MoodType) => {
    onUpdate({ mood: mood === note.mood ? 'neutral' : mood, moodStartTime: mood === note.mood ? null : Date.now() });
    setShowMoodPicker(false);
  }, [note.mood, onUpdate]);

  const handleImageAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { onUpdate({ images: [...note.images, reader.result as string] }); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [note.images, onUpdate]);

  const handleRemoveImage = useCallback((index: number) => {
    onUpdate({ images: note.images.filter((_, i) => i !== index) });
  }, [note.images, onUpdate]);

  const handleSaveContent = useCallback(() => {
    onUpdate({ content: editText });
    setIsEditing(false);
  }, [editText, onUpdate]);

  const bgColor = MOOD_COLORS[note.mood];
  const textColor = ['happy', 'neutral', 'calm'].includes(note.mood) ? '#1a1a1a' : '#ffffff';

  const moodTimerDisplay = note.moodStartTime
    ? (() => { const elapsed = Math.floor((Date.now() - note.moodStartTime) / 60000); const h = Math.floor(elapsed / 60); const m = elapsed % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; })()
    : null;

  const noteStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    color: textColor,
    width: note.size.width,
    height: note.size.height,
    left: note.position.x,
    top: note.position.y,
    zIndex: isDragging ? 100 : note.isPinned ? 5 : isActive ? 3 : 1,
    opacity: note.isVisible ? (isDragging ? 0.85 : 1) : 0,
    position: 'absolute',
    transition: isDragging ? 'none' : 'opacity 150ms ease',
    willChange: isDragging ? 'transform' : 'auto',
  };

  if (floatPreview) {
    noteStyle.borderRadius = '16px';
    noteStyle.boxShadow = '0 8px 40px rgba(0,0,0,0.35)';
    noteStyle.outline = '2px dashed var(--accent)';
    noteStyle.outlineOffset = '4px';
  }

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${note.isPinned ? 'pinned' : ''} ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${floatPreview ? 'float-preview' : ''}`}
      style={noteStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
    >
      <div className="sticky-header">
        <button className={`sticky-header-btn ${note.isPinned ? 'pin-active' : ''}`} onClick={(e) => { e.stopPropagation(); onTogglePin(); }} title={note.isPinned ? '取消置顶' : '置顶'}>📌</button>
        <button className="sticky-header-btn" onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }} title="隐藏">👁</button>
        <button className="sticky-header-btn" onClick={(e) => { e.stopPropagation(); onFloat(); }} title="弹出为独立窗口">↗</button>
        <button className="sticky-header-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="删除">✕</button>
      </div>
      <div className="sticky-content">
        {isEditing ? (
          <textarea className="sticky-editor" value={editText} onChange={e => setEditText(e.target.value)} onBlur={handleSaveContent}
            onKeyDown={e => { if (e.key === 'Escape') { setEditText(note.content); setIsEditing(false); } if (e.key === 'Enter' && e.ctrlKey) handleSaveContent(); }}
            autoFocus style={{ color: textColor }} placeholder="在这里输入内容..." />
        ) : (
          <div className="sticky-editor" onDoubleClick={() => { setIsEditing(true); setEditText(note.content); }}
            style={{ whiteSpace: 'pre-wrap', cursor: 'text', minHeight: 60 }}>
            {note.content ? renderContent(note.content) : <span style={{ opacity: 0.5 }}>双击编辑...</span>}
          </div>
        )}
        {note.images.length > 0 && (
          <div className="sticky-images">
            {note.images.map((img, idx) => (
              <div key={idx} className="sticky-image-wrapper">
                <img src={img} alt={`img-${idx}`} />
                <button className="remove-image-btn" onClick={() => handleRemoveImage(idx)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="sticky-mood-bar">
        <div className="sticky-mood-btn" onClick={() => setShowMoodPicker(!showMoodPicker)} title="选择心情">{MOOD_EMOJIS[note.mood]}</div>
        {showMoodPicker && <MoodPicker selectedMood={note.mood} onSelect={handleMoodSelect} onClose={() => setShowMoodPicker(false)} />}
        <button className="sticky-mood-btn" onClick={() => fileInputRef.current?.click()} title="添加图片">🖼</button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageAdd} />
        {moodTimerDisplay && <span className="sticky-mood-timer">⏱ {moodTimerDisplay}</span>}
      </div>
      <div className="sticky-resize-handle" onMouseDown={handleResizeStart} />
    </div>
  );
};

export default StickyEditor;
