// [M1.1] Chỉnh sửa preferences: defaultBudget + defaultMood → lưu vào users/{uid}.preferences
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../context/UserContext';
import { updateUserProfile } from '../../services/authService';
import { BUDGET_PRESETS, MOODS } from '../../utils/constants';
import { spacing, typography, colors, radius } from '../../utils/theme';

export default function EditPreferencesScreen({ navigation }) {
  const { user } = useAuth();
  const { profile } = useUser();

  const [selectedBudget, setSelectedBudget] = useState(
    profile?.preferences?.defaultBudget ?? BUDGET_PRESETS[1].max,
  );
  const [selectedMood, setSelectedMood] = useState(
    profile?.preferences?.defaultMood ?? MOODS[0].key,
  );
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        'preferences.defaultBudget': selectedBudget,
        'preferences.defaultMood': selectedMood,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionLabel}>Ngân sách mặc định</Text>
      <View style={styles.chipRow}>
        {BUDGET_PRESETS.map((b) => (
          <Chip
            key={b.key}
            selected={selectedBudget === b.max}
            onPress={() => setSelectedBudget(b.max)}
            style={[styles.chip, selectedBudget === b.max && styles.chipSelected]}
          >
            {b.label}
          </Chip>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Tâm trạng mặc định</Text>
      <View style={styles.chipRow}>
        {MOODS.map((m) => (
          <Chip
            key={m.key}
            selected={selectedMood === m.key}
            onPress={() => setSelectedMood(m.key)}
            style={[styles.chip, selectedMood === m.key && styles.chipSelected]}
          >
            {m.emoji} {m.label}
          </Chip>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving}
        style={styles.saveBtn}
      >
        Lưu sở thích
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  sectionLabel: { ...typography.subtitle, marginBottom: spacing.sm, marginTop: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary + '33' },
  saveBtn: { marginTop: spacing.xl },
});
