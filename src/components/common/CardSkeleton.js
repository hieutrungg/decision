// <CardSkeleton /> — placeholder nhấp nháy khi đang tải danh sách
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, spacing, radius, shadow } from '../../utils/theme';

function SkeletonCard({ opacity }) {
  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, { opacity }]} />
      <View style={styles.body}>
        <Animated.View style={[styles.lineLg, { opacity }]} />
        <Animated.View style={[styles.lineSm, { opacity }]} />
      </View>
    </View>
  );
}

export default function CardSkeleton({ count = 3 }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...shadow.sm,
  },
  image: { width: '100%', height: 160, backgroundColor: colors.border },
  body: { padding: spacing.md },
  lineLg: { height: 18, width: '70%', borderRadius: radius.sm, backgroundColor: colors.border, marginBottom: spacing.sm },
  lineSm: { height: 12, width: '40%', borderRadius: radius.sm, backgroundColor: colors.border },
});
