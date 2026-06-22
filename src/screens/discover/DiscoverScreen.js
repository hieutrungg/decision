import React, { useCallback, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
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

function toItineraryItems(items = []) {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    budget: item.budget,
    duration: item.duration,
    location: item.location,
  }));
}

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

  const openPackageMap = (items) => {
    navigation.navigate('Map', {
      viewMode: 'itinerary',
      itineraryKey: Date.now(),
      itinerary: toItineraryItems(items),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Toi nay lam gi?</Text>
        <Text style={styles.hint}>Lac dien thoai de nhan goi y ngau nhien</Text>

        <Button mode="contained" onPress={() => setFilterVisible(true)} style={styles.filterBtn}>
          Smart Filter - chon budget / thoi gian / mood
        </Button>

        {loading ? <ActivityIndicator style={styles.loading} /> : null}

        {!loading && single ? (
          <ExperienceCard
            experience={single}
            onPress={() => navigation.navigate('ExperienceDetail', { id: single.id })}
          />
        ) : null}

        {!loading && pkg ? (
          <PackageCard
            pkg={pkg}
            onItemPress={(item) => navigation.navigate('ExperienceDetail', { id: item.id })}
            onViewMap={openPackageMap}
          />
        ) : null}

        {!loading && error ? <Text style={styles.error}>Loi: {error}</Text> : null}

        {!loading && !single && !pkg && !error ? (
          <Text style={styles.empty}>Chua co goi y nao. Hay lac may hoac dung Smart Filter.</Text>
        ) : null}
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
  loading: { marginTop: spacing.xl },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.xl },
  empty: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});

