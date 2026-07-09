// [M5] Tìm bạn theo tên + follow/unfollow ngay tại chỗ
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { searchUsers, followUser, unfollowUser, getFollowing } from '../../services/friendService';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';

const DEBOUNCE_MS = 400;

export default function FindFriendsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null); // uid đang follow/unfollow, chặn double-tap
  const debounceRef = useRef(null);

  const runSearch = useCallback(
    async (kw) => {
      if (!kw.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const [users, myFollowing] = await Promise.all([searchUsers(kw), getFollowing(user.uid)]);
        setFollowingIds(new Set(myFollowing));
        setResults(users.filter((u) => u.uid !== user.uid)); // bỏ chính mình khỏi kết quả
      } finally {
        setLoading(false);
      }
    },
    [user.uid],
  );

  const onChangeKeyword = (text) => {
    setKeyword(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  };

  const onToggleFollow = async (targetId) => {
    setBusyId(targetId);
    try {
      if (followingIds.has(targetId)) {
        await unfollowUser(user.uid, targetId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await followUser(user.uid, targetId);
        setFollowingIds((prev) => new Set(prev).add(targetId));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Tìm bạn theo tên..."
        value={keyword}
        onChangeText={onChangeKeyword}
        style={styles.search}
      />

      {loading && <ActivityIndicator style={styles.loading} />}

      {!loading && keyword.trim() !== '' && results.length === 0 && (
        <Text style={styles.empty}>Không tìm thấy user nào 🔍</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isFollowed = followingIds.has(item.uid);
          return (
            <Card
              style={styles.card}
              onPress={() => navigation.navigate('FriendProfile', { uid: item.uid })}
            >
              <View style={styles.row}>
                <Avatar.Text size={44} label={(item.displayName ?? '?')[0]?.toUpperCase() ?? '?'} />
                <Text style={styles.name} numberOfLines={1}>
                  {item.displayName || item.email || 'User'}
                </Text>
                <Button
                  mode={isFollowed ? 'outlined' : 'contained'}
                  compact
                  loading={busyId === item.uid}
                  disabled={busyId === item.uid}
                  onPress={() => onToggleFollow(item.uid)}
                >
                  {isFollowed ? 'Bỏ theo dõi' : 'Theo dõi'}
                </Button>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  search: { marginBottom: spacing.md },
  loading: { marginTop: spacing.lg },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.lg },
  list: { paddingBottom: spacing.xl },
  card: { padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, ...typography.subtitle },
});
