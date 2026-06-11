// src/hooks/useShake.js
// [M2] Shake to Discover — phát hiện lắc điện thoại bằng Accelerometer (expo-sensors).
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { SHAKE_THRESHOLD, SHAKE_COOLDOWN_MS } from '../utils/constants';

/**
 * @param {() => void} onShake - callback khi phát hiện lắc
 * @param {boolean} enabled - bật/tắt listener (tắt khi rời màn hình Discover)
 */
export function useShake(onShake, enabled = true) {
  const lastShakeAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    Accelerometer.setUpdateInterval(100);

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      // Độ lớn gia tốc (đơn vị g). Đứng yên ≈ 1g, lắc mạnh > SHAKE_THRESHOLD
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > SHAKE_THRESHOLD && now - lastShakeAt.current > SHAKE_COOLDOWN_MS) {
        lastShakeAt.current = now;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onShake();
      }
    });

    return () => sub.remove();
  }, [onShake, enabled]);
}
