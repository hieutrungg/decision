// [M5] Danh sách đang theo dõi → bấm xem FriendProfile
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getFollowing, getUserProfile } from '../../services/friendService';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';

export default function FollowingScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState(null); // null = loading

  const load = useCallback(async () => {
    const ids = await getFollowing(user.uid);
    const profiles = await Promise.all(ids.map((uid) => getUserProfile(uid)));
    setItems(profiles.filter(Boolean)); // bỏ qua user đã bị xoá tài khoản
  }, [user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  if (items === null) return <ActivityIndicator style={styles.center} />;

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Bạn chưa theo dõi ai cả. Đi tìm bạn thôi! 🔎</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.uid}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() => navigation.navigate('FriendProfile', { uid: item.uid })}
        >
          <View style={styles.row}>
            <Avatar.Text size={44} label={(item.displayName ?? '?')[0]?.toUpperCase() ?? '?'} />
            <View style={styles.info}>
              <Text style={typography.subtitle} numberOfLines={1}>
                {item.displayName || item.email || 'Người dùng'}
              </Text>
              <Text style={typography.caption}>🔥 Chuỗi ngày: {item.streak ?? 0}</Text>
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  list: { padding: spacing.lg },
  card: { padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: { flex: 1 },
});
