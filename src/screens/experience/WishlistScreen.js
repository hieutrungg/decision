// [M4.5] Wishlist — danh sách experience đã bookmark
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, RefreshControl, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getBookmarks, getExperienceById } from '../../services/experienceService';
import { useAuth } from '../../hooks/useAuth';
import ExperienceCard from '../../components/experience/ExperienceCard';
import CardSkeleton from '../../components/common/CardSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { spacing, typography, colors } from '../../utils/theme';

export default function WishlistScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const ids = await getBookmarks(user.uid);
    const exps = await Promise.all(ids.map(getExperienceById));
    setItems(exps.filter(Boolean));
  }, [user.uid]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          await load();
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Danh sách đã lưu 🔖</Text>
      {loading ? (
        <View style={styles.skeletonWrap}>
          <CardSkeleton count={2} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={items.length ? styles.list : styles.listEmpty}
          renderItem={({ item }) => (
            <ExperienceCard
              experience={item}
              onPress={() => navigation.navigate('ExperienceDetail', { id: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🔖"
              title="Chưa lưu địa điểm nào"
              description="Bấm “Lưu” ở màn chi tiết để giữ lại những nơi bạn muốn ghé."
              actionLabel="Khám phá ngay"
              onAction={() => navigation.navigate('Discover')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.title, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  skeletonWrap: { paddingHorizontal: spacing.lg },
  list: { padding: spacing.lg, paddingTop: 0 },
  listEmpty: { flexGrow: 1 },
});
