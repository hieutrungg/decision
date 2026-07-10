import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useShake } from '../../hooks/useShake';
import { useRecommend } from '../../hooks/useRecommend';
import { useLastFilter } from '../../hooks/useLastFilter';
import { useUser } from '../../context/UserContext';
import PackageCard from '../../components/experience/PackageCard';
import ExperienceCard from '../../components/experience/ExperienceCard';
import FilterBottomSheet from '../../components/common/FilterBottomSheet';
import { spacing, typography, colors } from '../../utils/theme';
import { getCurrentTimeSlot } from '../../utils/timeSlot';
import { DURATION_PRESETS } from '../../utils/constants';

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
  const [lastRequest, setLastRequest] = useState(null);
  const { lastFilter, saveLastFilter } = useLastFilter();

  const getDefaultFilters = useCallback(
    () => ({
      budget: profile?.preferences?.defaultBudget ?? 500000,
      duration: DURATION_PRESETS[1].minutes,
      mood: profile?.preferences?.defaultMood ?? 'relax',
      timeSlot: getCurrentTimeSlot().key,
    }),
    [profile],
  );

  const effectiveFilter = useMemo(() => lastFilter ?? getDefaultFilters(), [lastFilter, getDefaultFilters]);

  const friendlyError = useMemo(() => {
    if (!error) return null;

    const normalized = error.toLowerCase();
    if (normalized.includes('index') || normalized.includes('failed-precondition')) {
      return 'Du lieu dang chuan bi de tra loi goi y. Hay thu doi filter hoac thu lai sau.';
    }

    return 'Tam thoi chua lay duoc goi y. Hay doi filter hoac thu khung gio khac.';
  }, [error]);

  const onShake = useCallback(() => {
    const filters = getDefaultFilters();
    setLastRequest({ mode: 'single', filters });
    randomOne(filters);
  }, [getDefaultFilters, randomOne]);

  useShake(onShake, isFocused);

  const onApplyFilter = async (filters) => {
    setFilterVisible(false);
    setLastRequest({ mode: 'package', filters });
    await saveLastFilter(filters);
    generate(filters);
  };

  const onRefreshSuggestion = useCallback(() => {
    const filters = lastRequest?.filters ?? effectiveFilter;

    if (pkg) {
      generate(filters);
      return;
    }

    if (single) {
      randomOne(filters);
    }
  }, [effectiveFilter, generate, lastRequest, pkg, randomOne, single]);

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

        {!loading && pkg ? (
          <View style={styles.resultBlock}>
            <PackageCard
              pkg={pkg}
              onItemPress={(item) => navigation.navigate('ExperienceDetail', { id: item.id })}
              onViewMap={openPackageMap}
            />
            <Button mode="outlined" icon="shuffle" onPress={onRefreshSuggestion} style={styles.repeatBtn}>
              Goi y khac
            </Button>
          </View>
        ) : null}

        {!loading && single ? (
          <View style={styles.resultBlock}>
            <ExperienceCard
              experience={single}
              onPress={() => navigation.navigate('ExperienceDetail', { id: single.id })}
            />
            <Button mode="outlined" icon="shuffle" onPress={onRefreshSuggestion} style={styles.repeatBtn}>
              Goi y khac
            </Button>
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.error}>{friendlyError}</Text> : null}

        {!loading && !single && !pkg && !error ? (
          <Text style={styles.empty}>Chua co goi y nao. Hay doi filter hoac lac may de lay goi y khac.</Text>
        ) : null}
      </ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={onApplyFilter}
        initialValues={effectiveFilter}
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
  resultBlock: { marginTop: spacing.md },
  repeatBtn: { marginTop: spacing.md },
  loading: { marginTop: spacing.xl },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.xl },
  empty: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});

