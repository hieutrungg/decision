// <PackageCard /> — hiển thị mini itinerary (doc mục 2.4 & 9)
// Bấm vào từng item → onItemPress(item) để mở chi tiết
import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { colors, spacing, typography } from '../../utils/theme';

export default function PackageCard({ pkg, onItemPress }) {
  if (!pkg?.items?.length) return null;
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.header}>🗓️ Kịch bản cho buổi tối của bạn</Text>
        {pkg.items.map((item, i) => (
          <View key={item.id}>
            <Pressable
              onPress={() => onItemPress?.(item)}
              android_ripple={{ color: colors.border }}
            >
              <View style={styles.row}>
                <Text style={styles.index}>{i + 1}</Text>
                <View style={styles.info}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {item.category} · {item.duration} phút · {(item.budget / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.meta}>📍 {item.location?.address}</Text>
                </View>
              </View>
            </Pressable>
            {i < pkg.items.length - 1 && <Divider style={styles.divider} />}
          </View>
        ))}
        <Divider style={styles.divider} />
        <Text style={styles.total}>
          Tổng: ~{(pkg.totalBudget / 1000).toFixed(0)}k · {Math.round(pkg.totalDuration / 60)} tiếng
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
  header: { ...typography.subtitle, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  index: {
    ...typography.subtitle,
    color: colors.primary,
    width: 24,
    textAlign: 'center',
  },
  info: { flex: 1 },
  title: { ...typography.body, fontWeight: '600' },
  meta: { ...typography.caption },
  divider: { marginVertical: spacing.xs },
  total: { ...typography.subtitle, color: colors.primary, marginTop: spacing.sm },
});
