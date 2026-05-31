import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DayData, MOOD_COLORS } from '../types';
import { formatLunarDay } from '../lunar';
import '../styles/calendar.css';

interface CalendarViewProps {
  dayDataMap: Record<string, DayData>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const ROWS_VISIBLE = 6;

interface DayCell {
  year: number;
  month: number;
  day: number;
  dateStr: string;
}

function generateWeeks(year: number): DayCell[][] {
  const weeks: DayCell[][] = [];
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  const current = new Date(firstDay);
  current.setDate(current.getDate() - current.getDay());
  while (current <= lastDay) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        day: current.getDate(),
        dateStr: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function addSurroundingWeeks(weeks: DayCell[][], year: number): DayCell[][] {
  const prevYearEnd = new Date(year - 1, 11, 31);
  const prevWeeks: DayCell[][] = [];
  const current = new Date(prevYearEnd);
  current.setDate(current.getDate() - (current.getDay() + 6));
  while (current < new Date(year, 0, 1)) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        day: current.getDate(),
        dateStr: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`,
      });
      current.setDate(current.getDate() + 1);
    }
    if (week.every(d => d.year < year)) {
      prevWeeks.push(week);
    } else {
      current.setDate(current.getDate() - 7);
      break;
    }
  }
  const nextYearStart = new Date(year + 1, 0, 1);
  const nextWeeks: DayCell[][] = [];
  const nc = new Date(nextYearStart);
  nc.setDate(nc.getDate() - nc.getDay());
  for (let w = 0; w < 8; w++) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        year: nc.getFullYear(),
        month: nc.getMonth(),
        day: nc.getDate(),
        dateStr: `${nc.getFullYear()}-${String(nc.getMonth() + 1).padStart(2, '0')}-${String(nc.getDate()).padStart(2, '0')}`,
      });
      nc.setDate(nc.getDate() + 1);
    }
    nextWeeks.push(week);
  }
  return [...prevWeeks, ...weeks, ...nextWeeks];
}

const CalendarView: React.FC<CalendarViewProps> = ({ dayDataMap, selectedDate, onDateSelect }) => {
  const today = new Date();
  const currentYear = today.getFullYear();

  const allWeeks = useMemo(() => {
    const yearWeeks = generateWeeks(currentYear);
    return addSurroundingWeeks(yearWeeks, currentYear);
  }, [currentYear]);

  const todayWeekIndex = useMemo(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return allWeeks.findIndex(w => w.some(d => d.dateStr === todayStr));
  }, [allWeeks, today]);

  const initialOffset = Math.max(0, todayWeekIndex - 1);
  const [weekOffset, setWeekOffset] = useState(initialOffset);
  const maxOffset = allWeeks.length - ROWS_VISIBLE;

  useEffect(() => {
    setWeekOffset(initialOffset);
  }, [initialOffset]);

  const isAnimating = useRef(false);

  const visibleWeeks = useMemo(() => {
    const clamped = Math.max(0, Math.min(weekOffset, maxOffset));
    return allWeeks.slice(clamped, clamped + ROWS_VISIBLE);
  }, [allWeeks, weekOffset, maxOffset]);

  const displayMonth = useMemo(() => {
    const firstCell = visibleWeeks[0]?.[0];
    if (!firstCell) return { year: today.getFullYear(), month: today.getMonth() };
    const secondRow = visibleWeeks[1];
    if (secondRow) {
      const midCell = secondRow[3];
      return { year: midCell.year, month: midCell.month };
    }
    return { year: firstCell.year, month: firstCell.month };
  }, [visibleWeeks, today]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (isAnimating.current) return;
    isAnimating.current = true;
    setWeekOffset(prev => Math.max(0, Math.min(prev + (e.deltaY > 0 ? 1 : -1), maxOffset)));
    requestAnimationFrame(() => { isAnimating.current = false; });
  }, [maxOffset]);

  const goToday = () => {
    setWeekOffset(Math.max(0, todayWeekIndex - 1));
    onDateSelect(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  const scrollToMonth = (year: number, month: number) => {
    const idx = allWeeks.findIndex(w => w.some(d => d.year === year && d.month === month && d.day >= 15));
    if (idx >= 0) {
      setWeekOffset(Math.max(0, Math.min(idx, maxOffset)));
    }
  };

  const prevMonth = () => {
    if (displayMonth.month === 0) {
      scrollToMonth(displayMonth.year - 1, 11);
    } else {
      scrollToMonth(displayMonth.year, displayMonth.month - 1);
    }
  };

  const nextMonth = () => {
    if (displayMonth.month === 11) {
      scrollToMonth(displayMonth.year + 1, 0);
    } else {
      scrollToMonth(displayMonth.year, displayMonth.month + 1);
    }
  };

  const getDayMoodColor = (dateStr: string): string | null => {
    const data = dayDataMap[dateStr];
    if (!data || data.moodRecords.length === 0) return null;
    return MOOD_COLORS[data.moodRecords[data.moodRecords.length - 1].mood];
  };

  const getTodoCount = (dateStr: string): number => {
    const data = dayDataMap[dateStr];
    if (!data) return 0;
    return data.todos.filter(t => !t.completed).length;
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevMonth}>‹</button>
          <span className="calendar-month-title">
            {displayMonth.year}年 {displayMonth.month + 1}月
          </span>
          <button className="calendar-nav-btn" onClick={nextMonth}>›</button>
        </div>
        <button className="today-btn" onClick={goToday}>今天</button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map(day => <div key={day} className="weekday">{day}</div>)}
      </div>
      <div className="calendar-scroll-area" onWheel={handleWheel}>
        <div className="calendar-scroll-track">
          {visibleWeeks.map((week, wi) => (
            <div key={wi} className="calendar-week-row">
              {week.map((cell, di) => {
                const cellDate = new Date(cell.year, cell.month, cell.day);
                const isToday = cell.dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isSelected = selectedDate === cell.dateStr;
                const isOtherMonth = cell.month !== displayMonth.month || cell.year !== displayMonth.year;
                const moodColor = getDayMoodColor(cell.dateStr);
                const todoCount = getTodoCount(cell.dateStr);
                const lunarText = formatLunarDay(cellDate);

                return (
                  <div
                    key={di}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isOtherMonth ? 'other-month' : ''}`}
                    onClick={() => onDateSelect(cell.dateStr)}
                    onDoubleClick={() => onDateSelect(cell.dateStr)}
                    style={moodColor ? { backgroundColor: moodColor + '22', borderColor: moodColor + '55' } : undefined}
                  >
                    <span className="day-number">{cell.day}</span>
                    <span className="day-lunar">{lunarText}</span>
                    <div className="day-indicators">
                      {moodColor && <div className="mood-dot" style={{ backgroundColor: moodColor }} />}
                      {todoCount > 0 && <span className="todo-badge">{todoCount} 待办</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
