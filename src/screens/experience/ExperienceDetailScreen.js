// [M4] Chi tiết experience: ảnh, mô tả, rating, bookmark, review
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { getExperienceById, toggleBookmark } from '../../services/experienceService';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';

export default function ExperienceDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [exp, setExp] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    getExperienceById(id).then(setExp);
  }, [id]);

  if (!exp) return <ActivityIndicator style={{ flex: 1 }} />;

  const onBookmark = async () => {
    const nowBookmarked = await toggleBookmark(user.uid, id);
    setBookmarked(nowBookmarked);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {exp.images?.[0] && <Image source={exp.images[0]} style={styles.image} contentFit="cover" />}
      <Text style={styles.title}>{exp.title}</Text>

      <View style={styles.row}>
        <Chip icon="tag">{exp.category}</Chip>
        <Chip icon="cash">{(exp.budget / 1000).toFixed(0)}k</Chip>
        <Chip icon="clock">{exp.duration} phút</Chip>
        <Chip icon="star">{exp.rating?.toFixed(1) ?? '—'}</Chip>
      </View>

      <Text style={styles.desc}>{exp.description}</Text>
      <Text style={styles.address}>📍 {exp.location?.address}</Text>

      <Button mode={bookmarked ? 'contained' : 'outlined'} icon="bookmark" onPress={onBookmark}>
        {bookmarked ? 'Đã lưu' : 'Lưu vào Wishlist'}
      </Button>

      {/* TODO [M4]: danh sách review + form viết review */}
      {/* TODO [M5]: nút "Đã trải nghiệm" → markCompleted + updateStreak */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  image: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.md },
  title: { ...typography.title, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  desc: { ...typography.body, marginBottom: spacing.md },
  address: { ...typography.caption, marginBottom: spacing.lg },
});
