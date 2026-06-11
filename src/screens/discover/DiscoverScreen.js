// [M2] Màn hình Discover — Shake to Discover + Smart Filter
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import { useShake } from '../../hooks/useShake';
import { useRecommend } from '../../hooks/useRecommend';
import { useUser } from '../../context/UserContext';
import PackageCard from '../../components/experience/PackageCard';
import ExperienceCard from '../../components/experience/ExperienceCard';
import FilterBottomSheet from '../../components/common/FilterBottomSheet';
import { spacing, typography, colors } from '../../utils/theme';

export default function DiscoverScreen() {
  const isFocused = useIsFocused();
  const { profile } = useUser();
  const { pkg, single, loading, generate, randomOne } = useRecommend();
  const [filterVisible, setFilterVisible] = useState(false);

  // Shake → random 1 experience theo preferences trong profile
  const onShake = useCallback(() => {
    randomOne({
      budget: profile?.preferences?.defaultBudget ?? 500000,
      mood: profile?.preferences?.defaultMood ?? 'relax',
    });
  }, [profile, randomOne]);

  useShake(onShake, isFocused); // chỉ lắng nghe khi đang ở màn hình này

  const onApplyFilter = (filters) => {
    setFilterVisible(false);
    generate(filters); // → mini itinerary
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tối nay làm gì? 🎲</Text>
        <Text style={styles.hint}>Lắc điện thoại để nhận gợi ý ngẫu nhiên</Text>

        <Button mode="contained" onPress={() => setFilterVisible(true)} style={styles.filterBtn}>
          Smart Filter — chọn budget / thời gian / mood
        </Button>

        {loading && <ActivityIndicator style={{ marginTop: spacing.xl }} />}

        {/* Kết quả Shake: 1 experience */}
        {!loading && single && <ExperienceCard experience={single} />}

        {/* Kết quả Smart Filter: mini itinerary */}
        {!loading && pkg && <PackageCard pkg={pkg} />}

        {!loading && !single && !pkg && (
          <Text style={styles.empty}>Chưa có gợi ý nào — lắc máy hoặc dùng Smart Filter nhé!</Text>
        )}
      </ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={onApplyFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl * 2 },
  title: { ...typography.title, marginBottom: spacing.xs },
  hint: { ...typography.caption, marginBottom: spacing.lg },
  filterBtn: { marginBottom: spacing.lg },
  empty: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});
