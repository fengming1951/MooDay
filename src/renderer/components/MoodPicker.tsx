import React from 'react';
import { MoodType, MOOD_EMOJIS, MOOD_LABELS } from '../types';
import '../styles/moodpicker.css';

interface MoodPickerProps {
  selectedMood: MoodType;
  onSelect: (mood: MoodType) => void;
  onClose: () => void;
}

const MOODS: MoodType[] = ['happy', 'calm', 'sad', 'excited', 'anxious', 'angry', 'neutral'];

const MoodPicker: React.FC<MoodPickerProps> = ({ selectedMood, onSelect }) => {
  return (
    <div className="mood-picker">
      {MOODS.map(mood => (
        <button
          key={mood}
          className={`mood-option ${selectedMood === mood ? 'selected' : ''}`}
          onClick={() => onSelect(mood)}
          title={MOOD_LABELS[mood]}
        >
          <span className="mood-emoji">{MOOD_EMOJIS[mood]}</span>
          <span className="mood-label">{MOOD_LABELS[mood]}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodPicker;
