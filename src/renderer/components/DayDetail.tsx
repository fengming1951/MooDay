import React, { useState, useCallback } from 'react';
import { DayData, MoodRecord, TodoItem, SubTask, MoodType, MOOD_EMOJIS, MOOD_LABELS } from '../types';
import '../styles/daydetail.css';

interface DayDetailProps {
  date: string;
  dayData: DayData;
  onUpdate: (date: string, data: Partial<DayData>) => void;
  onClose: () => void;
}

const MOODS: MoodType[] = ['happy', 'calm', 'sad', 'excited', 'anxious', 'angry', 'neutral'];

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateTime = (timestamp: number) => {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

const toDatetimeLocal = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const DayDetail: React.FC<DayDetailProps> = ({ date, dayData, onUpdate, onClose }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const [moodStartH, setMoodStartH] = useState('09');
  const [moodStartM, setMoodStartM] = useState('00');
  const [moodEndH, setMoodEndH] = useState('10');
  const [moodEndM, setMoodEndM] = useState('00');

  const [todoTitle, setTodoTitle] = useState('');
  const [todoSubtitle, setTodoSubtitle] = useState('');
  const [todoDeadline, setTodoDeadline] = useState('');
  const [todoStartTime, setTodoStartTime] = useState('');
  const [todoEndTime, setTodoEndTime] = useState('');

  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const sortedTodos = dayData.todos
  .map(t => t)
  .sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const handleAddMood = useCallback(() => {
    const [y, m, d] = date.split('-').map(Number);
    const startTime = new Date(y, m - 1, d, parseInt(moodStartH), parseInt(moodStartM)).getTime();
    const endTime = new Date(y, m - 1, d, parseInt(moodEndH), parseInt(moodEndM)).getTime();
    if (endTime <= startTime) return;

    const newRecord: MoodRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      mood: selectedMood,
      startTime,
      endTime,
      note: '',
    };
    const sortedRecords = [...dayData.moodRecords, newRecord].sort((a, b) => a.startTime - b.startTime);
    onUpdate(date, { moodRecords: sortedRecords });
  }, [date, selectedMood, moodStartH, moodStartM, moodEndH, moodEndM, dayData, onUpdate]);

  const handleDeleteMood = useCallback(
    (recordId: string) => onUpdate(date, { moodRecords: dayData.moodRecords.filter(r => r.id !== recordId) }),
    [date, dayData, onUpdate]
  );

  const handleAddTodo = useCallback(() => {
    if (!todoTitle.trim()) return;
    const newTodo: TodoItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title: todoTitle.trim(),
      subtitle: todoSubtitle.trim(),
      subTasks: [],
      deadline: todoDeadline ? new Date(todoDeadline).getTime() : null,
      startTime: todoStartTime ? new Date(todoStartTime).getTime() : null,
      endTime: todoEndTime ? new Date(todoEndTime).getTime() : null,
      completed: false,
      starred: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdate(date, { todos: [...dayData.todos, newTodo] });
    setTodoTitle(''); setTodoSubtitle(''); setTodoDeadline(''); setTodoStartTime(''); setTodoEndTime('');
  }, [date, todoTitle, todoSubtitle, todoDeadline, todoStartTime, todoEndTime, dayData, onUpdate]);

  const handleToggleTodo = useCallback((todoId: string) => {
    onUpdate(date, { todos: dayData.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t) });
  }, [date, dayData, onUpdate]);

  const handleDeleteTodo = useCallback((todoId: string) => {
    onUpdate(date, { todos: dayData.todos.filter(t => t.id !== todoId) });
  }, [date, dayData, onUpdate]);

  const handleStarTodo = useCallback((todoId: string) => {
    onUpdate(date, { todos: dayData.todos.map(t => t.id === todoId ? { ...t, starred: !t.starred, updatedAt: Date.now() } : t) });
  }, [date, dayData, onUpdate]);

  const toggleExpand = useCallback((todoId: string) => {
    setExpandedTodos(prev => { const next = new Set(prev); if (next.has(todoId)) next.delete(todoId); else next.add(todoId); return next; });
  }, []);

  const handleAddSubTask = useCallback((todoId: string, title: string) => {
    if (!title.trim()) return;
    const newSubTask: SubTask = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: title.trim(), completed: false };
    onUpdate(date, { todos: dayData.todos.map(t => t.id === todoId ? { ...t, subTasks: [...t.subTasks, newSubTask], updatedAt: Date.now() } : t) });
  }, [date, dayData, onUpdate]);

  const handleToggleSubTask = useCallback((todoId: string, subTaskId: string) => {
    onUpdate(date, { todos: dayData.todos.map(t => t.id === todoId ? { ...t, subTasks: t.subTasks.map(s => s.id === subTaskId ? { ...s, completed: !s.completed } : s), updatedAt: Date.now() } : t) });
  }, [date, dayData, onUpdate]);

  const startEditing = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditTitle(todo.title);
    setEditSubtitle(todo.subtitle);
    setEditDeadline(todo.deadline ? toDatetimeLocal(todo.deadline) : '');
    setEditStart(todo.startTime ? toDatetimeLocal(todo.startTime) : '');
    setEditEnd(todo.endTime ? toDatetimeLocal(todo.endTime) : '');
  };

  const saveEdit = () => {
    if (!editingTodoId || !editTitle.trim()) return;
    onUpdate(date, { todos: dayData.todos.map(t => t.id === editingTodoId ? {
      ...t,
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      deadline: editDeadline ? new Date(editDeadline).getTime() : null,
      startTime: editStart ? new Date(editStart).getTime() : null,
      endTime: editEnd ? new Date(editEnd).getTime() : null,
      updatedAt: Date.now(),
    } : t) });
    setEditingTodoId(null);
  };

  return (
    <div className="day-detail-overlay" onClick={onClose}>
      <div className="day-detail" onClick={(e) => e.stopPropagation()}>
        <div className="day-detail-header">
          <span className="day-detail-date">{date}</span>
          <button className="day-detail-close" onClick={onClose}>✕</button>
        </div>
        <div className="day-detail-body">
          <div className="mood-section">
            <div className="section-title">❤️ 心情记录</div>
            <div className="mood-create">
              <div className="mood-create-select">
                {MOODS.map(mood => (
                  <button key={mood} className={`mood-create-btn ${selectedMood === mood ? 'selected' : ''}`} onClick={() => setSelectedMood(mood)} title={MOOD_LABELS[mood]}>
                    {MOOD_EMOJIS[mood]}
                  </button>
                ))}
              </div>
              <div className="mood-time-inputs">
                <input className="mood-time-input" value={moodStartH} onChange={e => setMoodStartH(e.target.value)} maxLength={2} />
                <span className="mood-time-sep">:</span>
                <input className="mood-time-input" value={moodStartM} onChange={e => setMoodStartM(e.target.value)} maxLength={2} />
                <span className="mood-time-sep">-</span>
                <input className="mood-time-input" value={moodEndH} onChange={e => setMoodEndH(e.target.value)} maxLength={2} />
                <span className="mood-time-sep">:</span>
                <input className="mood-time-input" value={moodEndM} onChange={e => setMoodEndM(e.target.value)} maxLength={2} />
              </div>
              <button className="mood-add-btn" onClick={handleAddMood}>记录</button>
            </div>
            <div className="mood-record-list">
              {dayData.moodRecords.length === 0 ? (
                <p className="empty-hint">暂无心情记录，选择心情并设置时间段来添加</p>
              ) : (
                dayData.moodRecords.map(record => (
                  <div key={record.id} className="mood-record-item">
                    <span className="mood-record-emoji">{MOOD_EMOJIS[record.mood]}</span>
                    <span className="mood-record-time">{formatTime(record.startTime)} - {formatTime(record.endTime)}</span>
                    <span className="mood-record-note">{MOOD_LABELS[record.mood]}</span>
                    <button className="mood-record-delete" onClick={() => handleDeleteMood(record.id)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="todo-section">
            <div className="section-title">✅ 待办事项</div>
            <div className="todo-create-form">
              <input className="todo-input" placeholder="任务标题（必填）" value={todoTitle} onChange={e => setTodoTitle(e.target.value)} />
              <input className="todo-input" placeholder="副标题（可选）" value={todoSubtitle} onChange={e => setTodoSubtitle(e.target.value)} />
              <div className="todo-create-time-row">
                <input className="todo-datetime-input" type="datetime-local" value={todoDeadline} onChange={e => setTodoDeadline(e.target.value)} placeholder="截止日期" />
                <input className="todo-datetime-input" type="datetime-local" value={todoStartTime} onChange={e => setTodoStartTime(e.target.value)} placeholder="开始时间" />
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>-</span>
                <input className="todo-datetime-input" type="datetime-local" value={todoEndTime} onChange={e => setTodoEndTime(e.target.value)} placeholder="结束时间" />
              </div>
              <div className="todo-create-actions">
                <button className="todo-create-btn" onClick={handleAddTodo}>+ 创建任务</button>
              </div>
            </div>

            <div className="todo-list">
              {dayData.todos.length === 0 ? (
                <p className="empty-hint">暂无待办事项</p>
              ) : (
                sortedTodos.map(todo => {
                  const isExpanded = expandedTodos.has(todo.id);
                  const isEditing = editingTodoId === todo.id;
                  return (
                    <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.starred ? 'starred' : ''}`}>
                      <div className="todo-item-main" onClick={() => toggleExpand(todo.id)}>
                        <button
                          className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleTodo(todo.id); }}
                        >
                          {todo.completed ? '✓' : ''}
                        </button>
                        {isEditing ? (
                          <div className="todo-item-edit" onClick={(e) => e.stopPropagation()}>
                            <input className="todo-edit-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="标题" autoFocus />
                            <input className="todo-edit-input" value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} placeholder="副标题" />
                            <div className="todo-edit-time-row">
                              <input className="todo-datetime-input" type="datetime-local" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
                              <input className="todo-datetime-input" type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} />
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>-</span>
                              <input className="todo-datetime-input" type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                            </div>
                            <div className="todo-edit-actions">
                              <button className="save-btn" onClick={saveEdit}>✓ 保存</button>
                              <button className="cancel-btn" onClick={() => setEditingTodoId(null)}>取消</button>
                            </div>
                          </div>
                        ) : (
                          <div className="todo-item-content">
                            <span className="todo-item-title">{todo.title}</span>
                            {todo.subtitle && <span className="todo-item-subtitle">{todo.subtitle}</span>}
                            <div className="todo-item-meta">
                              {todo.deadline && <span>📅 {formatDateTime(todo.deadline)}</span>}
                              {todo.startTime && <span>🕐 {formatTime(todo.startTime)}</span>}
                              {todo.endTime && <span>- {formatTime(todo.endTime)}</span>}
                              {todo.subTasks.length > 0 && (
                                <span>📋 {todo.subTasks.filter(s => s.completed).length}/{todo.subTasks.length}</span>
                              )}
                            </div>
                          </div>
                        )}
                        <button
                          className="todo-item-star"
                          onClick={(e) => { e.stopPropagation(); handleStarTodo(todo.id); }}
                          title={todo.starred ? '取消标星' : '标星'}
                        >
                          {todo.starred ? '⭐' : '☆'}
                        </button>
                        <button
                          className="todo-item-edit-btn"
                          onClick={(e) => { e.stopPropagation(); if (isEditing) setEditingTodoId(null); else startEditing(todo); }}
                          title="编辑"
                        >
                          ✎
                        </button>
                        <button className="todo-item-delete" onClick={(e) => { e.stopPropagation(); handleDeleteTodo(todo.id); }}>✕</button>
                      </div>

                      {isExpanded && !isEditing && (
                        <div className="subtask-list" onClick={(e) => e.stopPropagation()}>
                          {todo.subTasks.map(sub => (
                            <div key={sub.id} className="subtask-item">
                              <button className={`subtask-checkbox ${sub.completed ? 'checked' : ''}`} onClick={() => handleToggleSubTask(todo.id, sub.id)}>
                                {sub.completed ? '✓' : ''}
                              </button>
                              <span className={`subtask-text ${sub.completed ? 'completed' : ''}`}>{sub.title}</span>
                            </div>
                          ))}
                          <SubTaskInput onAdd={(title) => handleAddSubTask(todo.id, title)} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SubTaskInputProps { onAdd: (title: string) => void; }

const SubTaskInput: React.FC<SubTaskInputProps> = ({ onAdd }) => {
  const [value, setValue] = useState('');
  const handleSubmit = () => { if (value.trim()) { onAdd(value.trim()); setValue(''); } };
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <input className="todo-input" style={{ height: 28, fontSize: 12, flex: 1 }} placeholder="添加子任务..." value={value}
        onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} />
      <button className="todo-create-btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleSubmit}>+</button>
    </div>
  );
};

export default DayDetail;
