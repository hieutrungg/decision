// [M1 + M5] Trang cá nhân: thông tin, preferences, streak, completed, follow, thành tích
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../context/UserContext';
import { spacing, typography, colors, radius, shadow } from '../../utils/theme';

function StatCard({ value, label, emoji, onPress }) {
  return (
    <Pressable style={styles.statCard} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{emoji ? `${emoji} ` : ''}{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { profile } = useUser();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {profile?.avatar ? (
            <Avatar.Image size={88} source={{ uri: profile.avatar }} />
          ) : (
            <Avatar.Text
              size={88}
              label={(profile?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
            />
          )}
          <Text style={styles.name}>{profile?.displayName || user?.email}</Text>
          {!!profile?.displayName && <Text style={styles.email}>{user?.email}</Text>}
          <Button
            mode="text"
            icon="pencil"
            onPress={() => navigation.navigate('EditProfile')}
            compact
          >
            Sửa hồ sơ
          </Button>
        </View>

        {/* Stats: streak + completed (bấm mở Completed) */}
        <View style={styles.statsRow}>
          <StatCard value={profile?.streak ?? 0} label="Chuỗi ngày" emoji="🔥" />
          <StatCard
            value={profile?.completedCount ?? 0}
            label="Đã trải nghiệm"
            emoji="✅"
            onPress={() => navigation.navigate('Completed')}
          />
        </View>

        {/* Follow: đang theo dõi (bấm mở Following) + người theo dõi */}
        <View style={styles.statsRow}>
          <StatCard
            value={profile?.followingCount ?? 0}
            label="Đang theo dõi"
            onPress={() => navigation.navigate('Following')}
          />
          <StatCard value={profile?.followerCount ?? 0} label="Người theo dõi" />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained-tonal"
            icon="tune"
            onPress={() => navigation.navigate('EditPreferences')}
            style={styles.actionBtn}
            contentStyle={styles.actionContent}
          >
            Cài đặt sở thích
          </Button>

          <Button
            mode="outlined"
            icon="trophy"
            onPress={() => navigation.navigate('Achievement')}
            style={styles.actionBtn}
            contentStyle={styles.actionContent}
          >
            Thành tích
          </Button>

          <Button
            mode="outlined"
            icon="account-search"
            onPress={() => navigation.navigate('FindFriends')}
            style={styles.actionBtn}
            contentStyle={styles.actionContent}
          >
            Tìm bạn
          </Button>

          <Button
            mode="outlined"
            icon="logout"
            onPress={logout}
            style={styles.actionBtn}
            contentStyle={styles.actionContent}
            textColor={colors.danger}
          >
            Đăng xuất
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  name: { ...typography.subtitle, fontSize: 20, marginTop: spacing.md },
  email: { ...typography.caption, marginTop: spacing.xs / 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadow.sm,
  },
  statNumber: { ...typography.title, fontSize: 28, color: colors.primary },
  statLabel: { ...typography.caption, marginTop: spacing.xs },
  actions: { gap: spacing.md, marginTop: spacing.md },
  actionBtn: { borderRadius: radius.full },
  actionContent: { paddingVertical: spacing.xs },
});
