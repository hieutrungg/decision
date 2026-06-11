// <ExperienceCard /> — dùng ở Discover, Browse, Bookmark (doc mục 9)
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { colors, spacing, typography, radius } from '../../utils/theme';

export default function ExperienceCard({ experience, onPress }) {
  if (!experience) return null;
  return (
    <Card style={styles.card} onPress={onPress}>
      {experience.images?.[0] && (
        <Image source={experience.images[0]} style={styles.image} contentFit="cover" />
      )}
      <Card.Content style={styles.content}>
        <Text style={styles.title}>{experience.title}</Text>
        <View style={styles.row}>
          <Chip compact>{experience.category}</Chip>
          <Text style={styles.meta}>
            {(experience.budget / 1000).toFixed(0)}k · {experience.duration} phút · ⭐{' '}
            {experience.rating?.toFixed(1) ?? '—'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: 140 },
  content: { paddingTop: spacing.sm },
  title: { ...typography.subtitle, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { ...typography.caption, color: colors.textMuted },
});
