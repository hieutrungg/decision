// src/utils/constants.js
export const CATEGORIES = ['cafe', 'workshop', 'food', 'entertainment'];

export const MOODS = [
  { key: 'relax', label: 'Thư giãn', emoji: '😌' },
  { key: 'energetic', label: 'Năng động', emoji: '⚡' },
  { key: 'social', label: 'Giao lưu', emoji: '🎉' },
];

export const BUDGET_PRESETS = [
  { key: 'low', label: 'Dưới 150k', max: 150000 },
  { key: 'mid', label: '150k – 300k', max: 300000 },
  { key: 'high', label: '300k – 500k', max: 500000 },
];

export const DURATION_PRESETS = [
  { key: '1h', label: '1 tiếng', minutes: 60 },
  { key: '3h', label: '3 tiếng', minutes: 180 },
  { key: 'evening', label: 'Cả buổi tối', minutes: 300 },
];

// Ngưỡng gia tốc để tính là "lắc" (m/s^2, đã trừ trọng lực ~1g)
export const SHAKE_THRESHOLD = 1.8;
export const SHAKE_COOLDOWN_MS = 1500;

export const COLLECTIONS = {
  USERS: 'users',
  EXPERIENCES: 'experiences',
  REVIEWS: 'reviews',
  BOOKMARKS: 'bookmarks',
  COMPLETED: 'completed',
  ACHIEVEMENTS: 'achievements',
};
export const TIME_SLOTS = [
  { key: 'morning',   label: 'Sáng',      emoji: '🌅', from: 5,  to: 11 },
  { key: 'noon',      label: 'Trưa',      emoji: '☀️', from: 11, to: 14 },
  { key: 'afternoon', label: 'Chiều',     emoji: '🌤️', from: 14, to: 18 },
  { key: 'evening',   label: 'Tối',       emoji: '🌆', from: 18, to: 23 },
  { key: 'night',     label: 'Đêm muộn',  emoji: '🌙', from: 23, to: 5 },
];
