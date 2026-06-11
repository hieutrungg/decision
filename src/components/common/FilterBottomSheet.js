// <FilterBottomSheet /> — chọn budget / time / mood, dùng chung (doc mục 9)
// Bản đơn giản dùng Modal để chạy được ngay; có thể nâng cấp lên @gorhom/bottom-sheet sau.
import React, { useState } from 'react';
import { Modal, StyleSheet, View, Pressable } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { MOODS, BUDGET_PRESETS, DURATION_PRESETS } from '../../utils/constants';
import { colors, spacing, typography, radius } from '../../utils/theme';

export default function FilterBottomSheet({ visible, onClose, onApply }) {
  const [budget, setBudget] = useState(BUDGET_PRESETS[1]);
  const [duration, setDuration] = useState(DURATION_PRESETS[1]);
  const [mood, setMood] = useState(MOODS[0]);

  const apply = () => {
    onApply({ budget: budget.max, duration: duration.minutes, mood: mood.key });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.heading}>Bạn muốn gì tối nay?</Text>

        <Text style={styles.label}>💰 Ngân sách</Text>
        <View style={styles.row}>
          {BUDGET_PRESETS.map((b) => (
            <Chip key={b.key} selected={budget.key === b.key} onPress={() => setBudget(b)}>
              {b.label}
            </Chip>
          ))}
        </View>

        <Text style={styles.label}>⏱️ Thời gian rảnh</Text>
        <View style={styles.row}>
          {DURATION_PRESETS.map((d) => (
            <Chip key={d.key} selected={duration.key === d.key} onPress={() => setDuration(d)}>
              {d.label}
            </Chip>
          ))}
        </View>

        <Text style={styles.label}>🎭 Mood</Text>
        <View style={styles.row}>
          {MOODS.map((m) => (
            <Chip key={m.key} selected={mood.key === m.key} onPress={() => setMood(m)}>
              {m.emoji} {m.label}
            </Chip>
          ))}
        </View>

        <Button mode="contained" onPress={apply} style={styles.applyBtn}>
          Gợi ý cho tôi 🎲
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: { ...typography.subtitle, marginBottom: spacing.md },
  label: { ...typography.body, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  applyBtn: { marginTop: spacing.lg },
});
