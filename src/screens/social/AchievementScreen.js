// [M5] Danh sách badge đã đạt / chưa đạt
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
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

  const load = useCallback(async () => {
    const map = await getGrantedBadges(user.uid);
    setGrantedMap(map);
  }, [user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  if (grantedMap === null) {
    return <ActivityIndicator style={styles.center} />;
  }

  const earnedCount = BADGES.filter((b) => grantedMap[b.id]).length;

  return (
    <FlatList
      data={BADGES}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.header}>
          Đã đạt {earnedCount}/{BADGES.length} thành tích
        </Text>
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
                <Text style={[typography.subtitle, !earned && styles.textLocked]}>
                  {item.title}
                </Text>
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
  header: { ...typography.subtitle, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  cardLocked: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  info: { flex: 1 },
  iconEarned: { backgroundColor: '#FFD54F' },
  iconLocked: { backgroundColor: '#CFD8DC' },
  textLocked: { color: '#888' },
  earnedDate: { ...typography.caption, marginTop: 4, color: '#4CAF50' },
});
