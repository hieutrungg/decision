// [M5] Danh sách các trải nghiệm đã hoàn thành (check-in)
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Card, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { getCompleted } from '../../services/socialService';
import { getExperienceById } from '../../services/experienceService';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';
import { getCategoryLabel } from '../../utils/constants';

function formatDate(ts) {
  // completedAt là Firestore Timestamp; nếu vừa ghi xong (chưa resolve) có thể null
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CompletedScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState(null); // null = loading lần đầu
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setItems([]);
      setError(null);
      return;
    }

    try {
      setError(null);
      const completed = await getCompleted(user.uid); // [{ expId, completedAt }]

      // map song song sang chi tiết experience, bỏ qua nếu experience đã bị xoá
      const withDetails = await Promise.all(
        completed.map(async (c) => {
          const exp = await getExperienceById(c.expId);
          return exp ? { ...c, exp } : null;
        }),
      );

      const sorted = withDetails.filter(Boolean).sort((a, b) => {
        const at = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt ?? 0);
        const bt = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt ?? 0);
        return bt - at; // mới nhất trước
      });

      setItems(sorted);
    } catch (e) {
      setItems([]);
      setError('Không tải được lịch sử trải nghiệm. Vui lòng thử lại sau.');
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (items === null) {
    return <ActivityIndicator style={styles.center} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>
          {error ?? 'Bạn chưa hoàn thành trải nghiệm nào cả 🌱'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.expId}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() => navigation.navigate('ExperienceDetail', { id: item.expId })}
        >
          <View style={styles.row}>
            {item.exp.images?.[0] && (
              <Image source={item.exp.images[0]} style={styles.thumb} contentFit="cover" />
            )}
            <View style={styles.info}>
              <Text style={typography.subtitle} numberOfLines={1}>
                {item.exp.title}
              </Text>
              <Text style={styles.date}>✅ {formatDate(item.completedAt)}</Text>
              <Chip compact icon="tag" style={styles.chip}>
                {getCategoryLabel(item.exp.category)}
              </Chip>
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  info: { flex: 1, justifyContent: 'center' },
  date: { ...typography.caption, marginTop: 2, marginBottom: 4 },
  chip: { alignSelf: 'flex-start' },
});
