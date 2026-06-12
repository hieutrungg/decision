// [M2] Màn hình Discover — Shake to Discover + Smart Filter
import React, { useCallback, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useShake } from '../../hooks/useShake';
import { useRecommend } from '../../hooks/useRecommend';
import { useUser } from '../../context/UserContext';
import PackageCard from '../../components/experience/PackageCard';
import ExperienceCard from '../../components/experience/ExperienceCard';
import FilterBottomSheet from '../../components/common/FilterBottomSheet';
import { spacing, typography, colors } from '../../utils/theme';
import { getCurrentTimeSlot } from '../../utils/timeSlot';

export default function DiscoverScreen({ navigation }) {
  const { pkg, single, loading, error, generate, randomOne } = useRecommend();
  const isFocused = useIsFocused();
  const { profile } = useUser();
  const [filterVisible, setFilterVisible] = useState(false);

  const onShake = useCallback(() => {
    randomOne({
      budget: profile?.preferences?.defaultBudget ?? 500000,
      mood: profile?.preferences?.defaultMood ?? 'relax',
      timeSlot: getCurrentTimeSlot().key,
    });
  }, [profile, randomOne]);

  useShake(onShake, isFocused);

  const onApplyFilter = (filters) => {
    setFilterVisible(false);
    generate(filters);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tối nay làm gì? 🎲</Text>
        <Text style={styles.hint}>Lắc điện thoại để nhận gợi ý ngẫu nhiên</Text>

        <Button mode="contained" onPress={() => setFilterVisible(true)} style={styles.filterBtn}>
          Smart Filter — chọn budget / thời gian / mood
        </Button>

        {loading && <ActivityIndicator style={{ marginTop: spacing.xl }} />}

        {!loading && single && (
          <ExperienceCard
            experience={single}
            onPress={() => navigation.navigate('ExperienceDetail', { id: single.id })}
          />
        )}

        {!loading && pkg && (
          <PackageCard
            pkg={pkg}
            onItemPress={(item) => navigation.navigate('ExperienceDetail', { id: item.id })}
          />
        )}

        {!loading && error && <Text style={styles.error}>⚠️ {error}</Text>}

        {!loading && !single && !pkg && !error && (
          <Text style={styles.empty}>Chưa có gợi ý nào — lắc máy hoặc dùng Smart Filter nhé!</Text>
        )}
      </ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={onApplyFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  title: { ...typography.title, marginBottom: spacing.xs },
  hint: { ...typography.caption, marginBottom: spacing.lg },
  filterBtn: { marginBottom: spacing.lg },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.xl },
  empty: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});