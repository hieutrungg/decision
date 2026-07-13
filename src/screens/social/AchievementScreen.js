
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { getGrantedBadges } from '../../services/socialService';
import { BADGES } from '../../utils/badges';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AchievementScreen() {
  const { user } = useAuth();
  const [grantedMap, setGrantedMap] = useState(null); // null = loading
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setGrantedMap({});
      setError(null);
      return;
    }

    try {
      setError(null);
      const map = await getGrantedBadges(user.uid);
      setGrantedMap(map);
    } catch (e) {
      setGrantedMap({});
      setError('Không tải được huy hiệu lúc này. Vui lòng thử lại sau.');
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  if (grantedMap === null) {
    return <ActivityIndicator style={styles.center} />;
  }

  const earnedCount = BADGES.filter((b) => grantedMap[b.id]).length;

  const headerText = error ?? 'Huy hiệu của bạn';

  return (
    <FlatList
      data={BADGES}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <Text style={styles.header}>{headerText}</Text>
          {!error && earnedCount === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyTitle}>Bạn chưa mở khóa huy hiệu nào.</Text>
                <Text style={styles.emptyBody}>Hãy bắt đầu khám phá để nhận huy hiệu đầu tiên!</Text>
              </Card.Content>
            </Card>
          ) : null}
          {!error ? <Text style={styles.summary}>Đã đạt {earnedCount}/{BADGES.length} thành tích</Text> : null}
        </View>
      }
      renderItem={({ item }) => {
        const earned = grantedMap[item.id];
        return (
          <Card style={[styles.card, !earned && styles.cardLocked]}>
            <View style={styles.row}>
              <Avatar.Icon
                size={48}
                icon={item.icon}
                style={earned ? styles.iconEarned : styles.iconLocked}
              />
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={[typography.subtitle, !earned && styles.textLocked]}>
                    {item.title}
                  </Text>
                  <Chip compact style={earned ? styles.stateEarned : styles.stateLocked} textStyle={styles.stateText}>
                    {earned ? 'Đã mở khóa' : 'Chưa mở khóa'}
                  </Chip>
                </View>
                <Text style={[typography.caption, !earned && styles.textLocked]}>
                  {item.description}
                </Text>
                {earned && (
                  <Text style={styles.earnedDate}>Đạt được: {formatDate(earned.grantedAt)}</Text>
                )}
              </View>
            </View>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  list: { padding: spacing.lg, gap: spacing.sm },
  headerBlock: { marginBottom: spacing.sm },
  header: { ...typography.subtitle, marginBottom: spacing.md },
  summary: { ...typography.caption, marginBottom: spacing.md },
  emptyCard: { marginBottom: spacing.md, borderRadius: radius.md },
  emptyTitle: { ...typography.subtitle, marginBottom: spacing.xs },
  emptyBody: { ...typography.caption },
  card: { marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  cardLocked: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  iconEarned: { backgroundColor: '#FFD54F' },
  iconLocked: { backgroundColor: '#CFD8DC' },
  textLocked: { color: '#888' },
  earnedDate: { ...typography.caption, marginTop: 4, color: '#4CAF50' },
  stateEarned: { backgroundColor: '#E8F5E9' },
  stateLocked: { backgroundColor: '#ECEFF1' },
  stateText: { fontSize: 10 },
});
