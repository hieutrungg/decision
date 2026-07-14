import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { colors, spacing, typography } from '../../utils/theme';
import { getCategoryLabel } from '../../utils/constants';

export default function PackageCard({ pkg, onItemPress, onViewMap }) {
  if (!pkg?.items?.length) return null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.header}>Lịch trình dành cho bạn</Text>

        {pkg.items.map((item, index) => (
          <View key={item.id}>
            <Pressable onPress={() => onItemPress?.(item)} android_ripple={{ color: colors.border }}>
              <View style={styles.row}>
                <Text style={styles.index}>{index + 1}</Text>
                <View style={styles.info}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {getCategoryLabel(item.category)} · {item.duration} phút · {(item.budget / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.meta}>Địa điểm: {item.location?.address}</Text>
                </View>
              </View>
            </Pressable>
            {index < pkg.items.length - 1 ? <Divider style={styles.divider} /> : null}
          </View>
        ))}

        <Divider style={styles.divider} />

        <Text style={styles.total}>
          Tổng: ~{(pkg.totalBudget / 1000).toFixed(0)}k · {Math.round(pkg.totalDuration / 60)} tiếng
        </Text>

        <Button mode="outlined" icon="map" onPress={() => onViewMap?.(pkg.items)} style={styles.mapButton}>
          Xem trên bản đồ
        </Button>
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
  mapButton: { marginTop: spacing.md },
});

