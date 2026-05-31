import React, { useState, useCallback, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import StickyBoard from './components/StickyBoard';
import DayDetail from './components/DayDetail';
import TodoListView from './components/TodoListView';
import Settings from './components/Settings';
import FloatSticky from './components/FloatSticky';
import { StickyNote, DayData } from './types';
import { loadFromStorage, saveToStorage, storageKeys } from './storage';
import './styles/app.css';

type ViewType = 'calendar' | 'sticky' | 'todos';
type ThemeMode = 'light' | 'dark';

const App: React.FC = () => {
  const isFloatMode = window.location.hash.startsWith('#float');

  if (isFloatMode) {
    return (
      <div className="app-container" style={{ borderRadius: 0, border: 'none' }}>
        <FloatSticky />
      </div>
    );
  }

  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() =>
    loadFromStorage<ThemeMode>(storageKeys.THEME, 'light')
  );
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    const loaded = loadFromStorage<StickyNote[]>(storageKeys.STICKY_NOTES, []);
    const fixed = loaded.map(s => ({ ...s, isVisible: true }));
    if (JSON.stringify(fixed) !== JSON.stringify(loaded)) {
      saveToStorage(storageKeys.STICKY_NOTES, fixed);
    }
    return fixed;
  });
  const [dayDataMap, setDayDataMap] = useState<Record<string, DayData>>(() =>
    loadFromStorage<Record<string, DayData>>(storageKeys.DAY_DATA, {})
  );
  const [activeStickyId, setActiveStickyId] = useState<string | null>(() =>
    loadFromStorage<string | null>(storageKeys.ACTIVE_STICKY_ID, null)
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveToStorage(storageKeys.THEME, theme);
  }, [theme]);

  useEffect(() => {
    saveToStorage(storageKeys.STICKY_NOTES, stickyNotes);
  }, [stickyNotes]);

  useEffect(() => {
    saveToStorage(storageKeys.DAY_DATA, dayDataMap);
  }, [dayDataMap]);

  useEffect(() => {
    saveToStorage(storageKeys.ACTIVE_STICKY_ID, activeStickyId);
  }, [activeStickyId]);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsubSync = window.electronAPI.onSyncFloatingSticky((data: StickyNote) => {
      setStickyNotes(prev => prev.map(s => {
        if (s.id !== data.id) return s;
        return {
          ...s,
          content: 'content' in data ? data.content : s.content,
          images: 'images' in data ? data.images : s.images,
          mood: 'mood' in data ? data.mood : s.mood,
          moodStartTime: 'moodStartTime' in data ? data.moodStartTime : s.moodStartTime,
          isPinned: 'isPinned' in data ? data.isPinned : s.isPinned,
          size: 'size' in data ? data.size : s.size,
          updatedAt: Date.now(),
        };
      }));
    });
    const unsubClosed = window.electronAPI.onFloatStickyClosed((id: string) => {
      setStickyNotes(prev => prev.map(s => s.id === id ? { ...s, isVisible: true } : s));
      setActiveView('sticky');
    });
    return () => {
      if (unsubSync) unsubSync();
      if (unsubClosed) unsubClosed();
    };
  }, []);

  const handleCreateSticky = useCallback(() => {
    const newSticky: StickyNote = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      content: '',
      images: [],
      mood: 'neutral',
      moodStartTime: null,
      isPinned: false,
      isVisible: true,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 },
      size: { width: 300, height: 260 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setStickyNotes(prev => [newSticky, ...prev]);
    setActiveStickyId(newSticky.id);
  }, []);

  const handleUpdateSticky = useCallback((id: string, updates: Partial<StickyNote>) => {
    setStickyNotes(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s))
    );
  }, []);

  const handleDeleteSticky = useCallback((id: string) => {
    setStickyNotes(prev => prev.filter(s => s.id !== id));
    if (activeStickyId === id) setActiveStickyId(null);
  }, [activeStickyId]);

  const handleTogglePin = useCallback((id: string) => {
    setStickyNotes(prev =>
      prev.map(s => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    setStickyNotes(prev =>
      prev.map(s => (s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    );
  }, []);

  const handleFloatSticky = useCallback((id: string) => {
    const sticky = stickyNotes.find(s => s.id === id);
    if (sticky) {
      window.electronAPI?.floatSticky(sticky);
      setStickyNotes(prev => prev.map(s => s.id === id ? { ...s, isVisible: false } : s));
    }
  }, [stickyNotes]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleUpdateDayData = useCallback((date: string, data: Partial<DayData>) => {
    setDayDataMap(prev => ({
      ...prev,
      [date]: { ...(prev[date] || { date, moodRecords: [], todos: [] }), ...data, date },
    }));
  }, []);

  const handleCloseDayDetail = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-body">
        <Sidebar
          activeView={activeView}
          onViewChange={(v) => { setActiveView(v); }}
          onOpenSettings={() => setShowSettings(true)}
        />
        <main className="app-main">
          {activeView === 'calendar' && (
            <CalendarView
              dayDataMap={dayDataMap}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          )}
          {activeView === 'sticky' && (
            <StickyBoard
              stickyNotes={stickyNotes}
              activeStickyId={activeStickyId}
              onCreateSticky={handleCreateSticky}
              onUpdateSticky={handleUpdateSticky}
              onDeleteSticky={handleDeleteSticky}
              onTogglePin={handleTogglePin}
              onToggleVisibility={handleToggleVisibility}
              onFloatSticky={handleFloatSticky}
              onSelectSticky={setActiveStickyId}
            />
          )}
          {activeView === 'todos' && (
            <TodoListView dayDataMap={dayDataMap} onDateClick={(date) => {
              setSelectedDate(date);
              setActiveView('calendar');
            }} onUpdate={handleUpdateDayData} />
          )}
        </main>
      </div>
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          dayData={dayDataMap[selectedDate] || { date: selectedDate, moodRecords: [], todos: [] }}
          onUpdate={handleUpdateDayData}
          onClose={handleCloseDayDetail}
        />
      )}
      {showSettings && (
        <Settings
          theme={theme}
          onThemeChange={setTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
