// [M5] Trang cá nhân của bạn bè: tên, streak, completed list, reviews của họ
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Card, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRoute } from '@react-navigation/native';
import {
  getUserProfile,
  isFollowing,
  followUser,
  unfollowUser,
} from '../../services/friendService';
import { getUserActivity } from '../../services/friendService';
import { getExperienceById, getReviewsByUser } from '../../services/experienceService';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FriendProfileScreen() {
  const { params } = useRoute();
  const { uid } = params;
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [followed, setFollowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(null);
  const [reviews, setReviews] = useState(null);

  const load = useCallback(async () => {
    const [p, followState, activity, myReviews] = await Promise.all([
      getUserProfile(uid),
      isFollowing(user.uid, uid),
      getUserActivity(uid),
      getReviewsByUser(uid),
    ]);
    setProfile(p);
    setFollowed(followState);

    const withDetails = await Promise.all(
      activity.map(async (c) => {
        const exp = await getExperienceById(c.expId);
        return exp ? { ...c, exp } : null;
      }),
    );
    setCompleted(withDetails.filter(Boolean));

    const reviewsWithExp = await Promise.all(
      myReviews.map(async (r) => {
        const exp = await getExperienceById(r.expId);
        return { ...r, expTitle: exp?.title ?? '(trải nghiệm đã bị xoá)' };
      }),
    );
    setReviews(reviewsWithExp);
  }, [uid, user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleFollow = async () => {
    setBusy(true);
    try {
      if (followed) {
        await unfollowUser(user.uid, uid);
        setFollowed(false);
      } else {
        await followUser(user.uid, uid);
        setFollowed(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!profile || completed === null || reviews === null) {
    return <ActivityIndicator style={styles.center} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Avatar.Text size={72} label={(profile.displayName ?? '?')[0]?.toUpperCase() ?? '?'} />
      <Text style={styles.name}>{profile.displayName || profile.email}</Text>

      <Button
        mode={followed ? 'outlined' : 'contained'}
        onPress={onToggleFollow}
        loading={busy}
        disabled={busy}
        style={styles.followBtn}
      >
        {followed ? 'Bỏ theo dõi' : 'Theo dõi'}
      </Button>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{profile.streak ?? 0}</Text>
            <Text>🔥 Chuỗi ngày</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{profile.completedCount ?? 0}</Text>
            <Text>✅ Đã trải nghiệm</Text>
          </Card.Content>
        </Card>
      </View>

      <Divider style={styles.divider} />
      <Text style={styles.sectionTitle}>Đã hoàn thành</Text>
      {completed.length === 0 && <Text style={typography.caption}>Chưa có trải nghiệm nào.</Text>}
      {completed.map((item) => (
        <Card key={item.expId} style={styles.itemCard}>
          <View style={styles.row}>
            {item.exp.images?.[0] && (
              <Image source={item.exp.images[0]} style={styles.thumb} contentFit="cover" />
            )}
            <View style={styles.info}>
              <Text style={typography.subtitle} numberOfLines={1}>
                {item.exp.title}
              </Text>
              <Text style={typography.caption}>✅ {formatDate(item.completedAt)}</Text>
            </View>
          </View>
        </Card>
      ))}

      <Divider style={styles.divider} />
      <Text style={styles.sectionTitle}>Đánh giá</Text>
      {reviews.length === 0 && <Text style={typography.caption}>Chưa có đánh giá nào.</Text>}
      {reviews.map((r) => (
        <Card key={r.id} style={styles.itemCard}>
          <Card.Content>
            <View style={styles.reviewHeader}>
              <Text style={typography.subtitle} numberOfLines={1}>
                {r.expTitle}
              </Text>
              <Chip compact icon="star">
                {r.rating}
              </Chip>
            </View>
            {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
            <Text style={typography.caption}>{formatDate(r.createdAt)}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  name: { ...typography.subtitle, marginTop: spacing.md, marginBottom: spacing.md },
  followBtn: { alignSelf: 'stretch', marginBottom: spacing.lg },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  statCard: { flex: 1 },
  statNumber: { ...typography.title },
  divider: { alignSelf: 'stretch', marginVertical: spacing.md },
  sectionTitle: { ...typography.subtitle, alignSelf: 'flex-start', marginBottom: spacing.sm },
  itemCard: {
    alignSelf: 'stretch',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  info: { flex: 1 },
  comment: { ...typography.body, marginTop: spacing.sm, marginBottom: spacing.sm },
});
