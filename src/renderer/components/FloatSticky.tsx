import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote, MOOD_COLORS, MOOD_EMOJIS, MoodType } from '../types';
import MoodPicker from './MoodPicker';
import '../styles/floatsticky.css';

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
      <span key={match.index} className="sticky-url" onClick={(e) => { e.stopPropagation(); window.electronAPI?.openExternalUrl(url); }} title={url}>
        {url}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
};

const FloatSticky: React.FC = () => {
  const [note, setNote] = useState<StickyNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isOutside, setIsOutside] = useState(false);
  const [nearCenter, setNearCenter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    const u1 = window.electronAPI.onFloatStickyData((data: StickyNote) => {
      setNote(data);
      setEditText(data.content);
    });
    const u2 = window.electronAPI.onFloatPreviewMode((v: boolean) => setIsPreview(v));
    const u3 = window.electronAPI.onFloatPreviewOutside((v: boolean) => setIsOutside(v));
    const u4 = window.electronAPI.onFloatOverMain((v: boolean) => setNearCenter(v));
    return () => { if (u1) u1(); if (u2) u2(); if (u3) u3(); if (u4) u4(); };
  }, []);

  const syncToMain = useCallback((updates: Partial<StickyNote>) => {
    if (!note) return;
    const updated = { ...note, ...updates, updatedAt: Date.now() };
    setNote(updated);
    const safe: Record<string, unknown> = {};
    for (const k of Object.keys(updated)) {
      if (k !== 'isVisible' && k !== 'position' && k !== 'createdAt') {
        safe[k] = (updated as Record<string, unknown>)[k];
      }
    }
    window.electronAPI?.syncFloatingSticky(safe);
  }, [note]);

  const handleMoodSelect = useCallback((mood: MoodType) => {
    if (!note) return;
    syncToMain({ mood: mood === note.mood ? 'neutral' : mood, moodStartTime: mood === note.mood ? null : Date.now() });
    setShowMoodPicker(false);
    window.electronAPI?.updateFloatingTitle({ id: note.id, mood, pinned: note.isPinned });
  }, [note, syncToMain]);

  const handleSaveContent = useCallback(() => {
    syncToMain({ content: editText });
    setIsEditing(false);
  }, [editText, syncToMain]);

  const handleImageAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !note) return;
    const reader = new FileReader();
    reader.onload = () => syncToMain({ images: [...note.images, reader.result as string] });
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [note, syncToMain]);

  const handleRemoveImage = useCallback((index: number) => {
    if (!note) return;
    syncToMain({ images: note.images.filter((_, i) => i !== index) });
  }, [note, syncToMain]);

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  if (!note) {
    return <div className="float-sticky" style={{ background: 'var(--bg-primary)' }}>加载中...</div>;
  }

  const bgColor = MOOD_COLORS[note.mood];
  const textColor = ['happy', 'neutral', 'calm'].includes(note.mood) ? '#1a1a1a' : '#ffffff';

  return (
    <div
      className={`float-sticky ${isPreview ? 'preview-mode' : ''} ${isOutside ? 'outside' : 'inside'} ${nearCenter ? 'near-center' : ''}`}
      style={{ backgroundColor: bgColor, color: textColor, borderRadius: isPreview ? (isOutside ? 16 : 8) : 16 }}
    >
      {!isPreview && (
        <div className="float-sticky-header">
          <div className="float-sticky-mood" onClick={() => setShowMoodPicker(!showMoodPicker)}>
            {MOOD_EMOJIS[note.mood]}
          </div>
          <div className="float-sticky-actions">
            <button className="float-sticky-btn" onClick={() => fileInputRef.current?.click()} title="添加图片">🖼</button>
            <button className="float-sticky-btn" onClick={handleClose} title="关闭">✕</button>
          </div>
        </div>
      )}
      <div className="float-sticky-body" style={{ transition: 'padding 200ms ease', padding: isPreview ? '12px' : '0 12px 12px' }}>
        {isEditing ? (
          <textarea
            className="float-sticky-editor"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={handleSaveContent}
            onKeyDown={e => {
              if (e.key === 'Escape') { setEditText(note.content); setIsEditing(false); }
              if (e.key === 'Enter' && e.ctrlKey) handleSaveContent();
            }}
            autoFocus
            style={{ color: textColor }}
          />
        ) : (
          <div className="float-sticky-content" onDoubleClick={() => { setIsEditing(true); setEditText(note.content); }} style={{ cursor: 'text' }}>
            {note.content ? renderContent(note.content) : <span style={{ opacity: 0.5 }}>双击编辑...</span>}
          </div>
        )}
        {note.images.length > 0 && (
          <div className="float-sticky-images">
            {note.images.map((img, idx) => (
              <div key={idx} className="float-sticky-img-wrap">
                <img src={img} alt={`img-${idx}`} />
                <button className="float-sticky-img-remove" onClick={() => handleRemoveImage(idx)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageAdd} />
      {showMoodPicker && (
        <div className="float-mood-picker">
          <MoodPicker selectedMood={note.mood} onSelect={handleMoodSelect} onClose={() => setShowMoodPicker(false)} />
        </div>
      )}
    </div>
  );
};

export default FloatSticky;
