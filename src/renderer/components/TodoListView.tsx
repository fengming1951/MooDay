import React, { useMemo, useState, useCallback } from 'react';
import { DayData, TodoItem } from '../types';
import '../styles/todolist.css';

interface TodoListViewProps {
  dayDataMap: Record<string, DayData>;
  onDateClick: (date: string) => void;
  onUpdate: (date: string, data: Partial<DayData>) => void;
}

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const toDatetimeLocal = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TodoListView: React.FC<TodoListViewProps> = ({ dayDataMap, onDateClick, onUpdate }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const allTodos = useMemo(() => {
    const result: { date: string; todo: TodoItem }[] = [];
    Object.entries(dayDataMap).forEach(([date, data]) => {
      data.todos.forEach(todo => result.push({ date, todo }));
    });
    result.sort((a, b) => {
      if (a.todo.starred !== b.todo.starred) return a.todo.starred ? -1 : 1;
      if (a.todo.completed !== b.todo.completed) return a.todo.completed ? 1 : -1;
      if (a.todo.deadline && b.todo.deadline) return a.todo.deadline - b.todo.deadline;
      return b.todo.createdAt - a.todo.createdAt;
    });
    return result;
  }, [dayDataMap]);

  const incomplete = allTodos.filter(t => !t.todo.completed);
  const completed = allTodos.filter(t => t.todo.completed);

  const handleCreate = useCallback(() => {
    if (!newTitle.trim() || !newDate) return;
    const newTodo: TodoItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      subTasks: [],
      deadline: newDeadline ? new Date(newDeadline).getTime() : null,
      startTime: newStart ? new Date(newStart).getTime() : null,
      endTime: newEnd ? new Date(newEnd).getTime() : null,
      completed: false,
      starred: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const existing = dayDataMap[newDate] || { date: newDate, moodRecords: [], todos: [] };
    onUpdate(newDate, { todos: [...existing.todos, newTodo] });
    setNewTitle(''); setNewSubtitle(''); setNewDeadline(''); setNewStart(''); setNewEnd('');
    setShowCreate(false);
  }, [newTitle, newSubtitle, newDeadline, newStart, newEnd, newDate, dayDataMap, onUpdate]);

  const handleStar = useCallback((date: string, todoId: string) => {
    const data = dayDataMap[date];
    if (!data) return;
    onUpdate(date, { todos: data.todos.map(t => t.id === todoId ? { ...t, starred: !t.starred, updatedAt: Date.now() } : t) });
  }, [dayDataMap, onUpdate]);

  const handleToggle = useCallback((date: string, todoId: string) => {
    const data = dayDataMap[date];
    if (!data) return;
    onUpdate(date, { todos: data.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t) });
  }, [dayDataMap, onUpdate]);

  const handleDelete = useCallback((date: string, todoId: string) => {
    const data = dayDataMap[date];
    if (!data) return;
    onUpdate(date, { todos: data.todos.filter(t => t.id !== todoId) });
  }, [dayDataMap, onUpdate]);

  return (
    <div className="todolist-view">
      <div className="todolist-header">
        <span className="todolist-title">所有待办事项</span>
        <div className="todolist-header-actions">
          <span className="todolist-count">{incomplete.length} 未完成 / {allTodos.length} 总计</span>
          <button className="todolist-create-btn" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '取消' : '+ 创建任务'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="todolist-create-form">
          <div className="todolist-create-row">
            <input
              className="todolist-create-input"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              type="date"
            />
          </div>
          <input
            className="todolist-create-input"
            placeholder="任务标题（必填）"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <input
            className="todolist-create-input"
            placeholder="副标题（可选）"
            value={newSubtitle}
            onChange={e => setNewSubtitle(e.target.value)}
          />
          <div className="todolist-create-row">
            <input className="todolist-create-input" type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="截止日期" style={{ flex: 1 }} />
            <input className="todolist-create-input" type="datetime-local" value={newStart} onChange={e => setNewStart(e.target.value)} placeholder="开始" style={{ flex: 1 }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>-</span>
            <input className="todolist-create-input" type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)} placeholder="结束" style={{ flex: 1 }} />
          </div>
          <button className="todolist-submit-btn" onClick={handleCreate}>✓ 创建</button>
        </div>
      )}

      <div className="todolist-body">
        {incomplete.length > 0 && (
          <div className="todolist-group">
            <div className="todolist-group-title">🕐 未完成</div>
            {incomplete.map(({ date, todo }) => (
              <div key={todo.id} className={`todolist-item ${todo.completed ? 'completed' : ''} ${todo.starred ? 'starred' : ''}`}>
                <button
                  className={`todolist-item-check ${todo.completed ? 'checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleToggle(date, todo.id); }}
                >
                  {todo.completed ? '✓' : '○'}
                </button>
                <div className="todolist-item-content" onDoubleClick={() => onDateClick(date)}>
                  <span className="todolist-item-title">{todo.title}</span>
                  {todo.subtitle && <span className="todolist-item-sub">{todo.subtitle}</span>}
                  <div className="todolist-item-meta">
                    <span className="todolist-item-date" onClick={(e) => { e.stopPropagation(); onDateClick(date); }}>📅 {date}</span>
                    {todo.deadline && <span>⏰ {formatDateTime(todo.deadline)}</span>}
                    {todo.subTasks.length > 0 && (
                      <span>📋 {todo.subTasks.filter(s => s.completed).length}/{todo.subTasks.length}</span>
                    )}
                  </div>
                </div>
                <button
                  className="todolist-item-star"
                  onClick={(e) => { e.stopPropagation(); handleStar(date, todo.id); }}
                  title={todo.starred ? '取消标星' : '标星'}
                >
                  {todo.starred ? '⭐' : '☆'}
                </button>
                <button
                  className="todolist-item-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(date, todo.id); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <div className="todolist-group">
            <div className="todolist-group-title">✅ 已完成</div>
            {completed.map(({ date, todo }) => (
              <div key={todo.id} className={`todolist-item completed ${todo.starred ? 'starred' : ''}`}>
                <button
                  className="todolist-item-check checked"
                  onClick={(e) => { e.stopPropagation(); handleToggle(date, todo.id); }}
                >
                  ✓
                </button>
                <div className="todolist-item-content" onDoubleClick={() => onDateClick(date)}>
                  <span className="todolist-item-title">{todo.title}</span>
                  {todo.subtitle && <span className="todolist-item-sub">{todo.subtitle}</span>}
                  <div className="todolist-item-meta">
                    <span className="todolist-item-date" onClick={(e) => { e.stopPropagation(); onDateClick(date); }}>📅 {date}</span>
                  </div>
                </div>
                <button
                  className="todolist-item-star"
                  onClick={(e) => { e.stopPropagation(); handleStar(date, todo.id); }}
                  title={todo.starred ? '取消标星' : '标星'}
                >
                  {todo.starred ? '⭐' : '☆'}
                </button>
                <button
                  className="todolist-item-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(date, todo.id); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {incomplete.length === 0 && completed.length === 0 && (
          <div className="todolist-empty">
            <span className="todolist-empty-emoji">📋</span>
            <p>暂无待办事项</p>
            <p className="todolist-empty-hint">点击上方"创建任务"按钮来添加</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoListView;
