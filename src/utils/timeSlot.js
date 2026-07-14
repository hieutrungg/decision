// Xác định khung giờ từ giờ hệ thống (0-23)
import { TIME_SLOTS } from './constants';

export function getTimeSlotByHour(hour) {
  return (
    TIME_SLOTS.find((s) =>
      s.from < s.to
        ? hour >= s.from && hour < s.to
        : hour >= s.from || hour < s.to, // ca qua đêm (23→5)
    ) ?? TIME_SLOTS[3] // fallback: tối
  );
}

export const getCurrentTimeSlot = () => getTimeSlotByHour(new Date().getHours());

export function getTimeSlotQuestion(slot = getCurrentTimeSlot()) {
  switch (slot?.key) {
    case 'morning':
      return 'Sáng nay làm gì nhỉ?';
    case 'noon':
      return 'Trưa nay làm gì nhỉ?';
    case 'afternoon':
      return 'Chiều nay làm gì nhỉ?';
    case 'evening':
      return 'Tối nay làm gì nhỉ?';
    case 'night':
      return 'Đêm nay làm gì nhỉ?';
    default:
      return 'Làm gì bây giờ nhỉ?';
  }
}
