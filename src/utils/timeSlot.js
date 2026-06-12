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