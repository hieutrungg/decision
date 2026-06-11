// src/utils/theme.js
// UI Kit chung — TẤT CẢ component dùng giá trị từ đây, không hardcode màu/spacing.
import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#FF6B35', // cam năng lượng — màu thương hiệu
  secondary: '#2EC4B6',
  background: '#FFFFFF',
  surface: '#F7F7F7',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  success: '#22C55E',
  danger: '#EF4444',
  // màu theo mood
  mood: {
    relax: '#A7C7E7',
    energetic: '#FFB347',
    social: '#C3AED6',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
};

// Theme cho react-native-paper
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
  },
};
