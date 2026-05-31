export type MoodType = 'happy' | 'calm' | 'sad' | 'excited' | 'anxious' | 'angry' | 'neutral';

export interface StickyNote {
  id: string;
  content: string;
  images: string[];
  mood: MoodType;
  moodStartTime: number | null;
  isPinned: boolean;
  isVisible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: number;
  updatedAt: number;
}

export interface MoodRecord {
  id: string;
  mood: MoodType;
  startTime: number;
  endTime: number;
  note: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  subtitle: string;
  subTasks: SubTask[];
  deadline: number | null;
  startTime: number | null;
  endTime: number | null;
  completed: boolean;
  starred: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DayData {
  date: string;
  moodRecords: MoodRecord[];
  todos: TodoItem[];
}

export const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#FFD700',
  calm: '#98FB98',
  sad: '#87CEEB',
  excited: '#FF6B6B',
  anxious: '#DDA0DD',
  angry: '#FF6347',
  neutral: '#FFFFFF',
};

export const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  sad: '难过',
  excited: '兴奋',
  anxious: '焦虑',
  angry: '生气',
  neutral: '中性',
};

export const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  excited: '🤩',
  anxious: '😰',
  angry: '😡',
  neutral: '😐',
};
