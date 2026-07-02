// [M1 + M5] Trang cá nhân: thông tin, preferences, streak, completed count
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../context/UserContext';
import { spacing, typography } from '../../utils/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile } = useUser();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Avatar.Text
        size={72}
        label={(profile?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
      />
      <Text style={styles.name}>{profile?.displayName || user?.email}</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{profile?.streak ?? 0}</Text>
            <Text>🔥 Streak</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{profile?.completedCount ?? 0}</Text>
            <Text>✅ Đã trải nghiệm</Text>
          </Card.Content>
        </Card>
      </View>

      <Button
        mode="outlined"
        icon="check-circle"
        onPress={() => navigation.navigate('Completed')}
        style={styles.completedBtn}
      >
        Trải nghiệm đã hoàn thành
      </Button>
      {/* TODO [M5]: danh sách achievement badges */}
      {/* TODO [M1]: chỉnh sửa preferences (defaultBudget, defaultMood) */}

      <Button mode="outlined" onPress={logout} style={styles.logout}>
        Đăng xuất
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: spacing.xl * 2, padding: spacing.lg },
  name: { ...typography.subtitle, marginTop: spacing.md, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1 },
  statNumber: { ...typography.title },
  logout: { marginTop: 'auto', marginBottom: spacing.xl, alignSelf: 'stretch' },
});
