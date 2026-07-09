// <EmptyState /> — trạng thái rỗng/ lỗi nhất quán cho mọi danh sách
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { spacing, typography, colors } from '../../utils/theme';

export default function EmptyState({ emoji = '🤷', title, description, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!description && <Text style={styles.desc}>{description}</Text>}
      {!!actionLabel && onAction && (
        <Button mode="contained-tonal" onPress={onAction} style={styles.btn}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2, paddingHorizontal: spacing.xl },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.subtitle, textAlign: 'center', marginBottom: spacing.xs },
  desc: { ...typography.caption, textAlign: 'center', lineHeight: 18 },
  btn: { marginTop: spacing.lg },
});
