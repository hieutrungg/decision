// [M4] Chi tiết experience: ảnh, mô tả, rating, bookmark, chỉ đường, check-in, chia sẻ
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  Linking,
  Platform,
  Keyboard,
  Share,
} from 'react-native';
import { Text, Button, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  getExperienceById,
  toggleBookmark,
  getBookmarks,
  deleteExperience,
} from '../../services/experienceService';
import ReviewSection from '../../components/experience/ReviewSection';
import {
  markCompleted,
  updateStreak,
  getCompleted,
  getLastCompleted,
  checkAndGrantBadges,
} from '../../services/socialService';
import { haversineKm } from '../../api/maps';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius, colors, shadow } from '../../utils/theme';
import { getCategoryLabel } from '../../utils/constants';

const CHECKIN_RADIUS_KM = 0.5; // 500m

export default function ExperienceDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [exp, setExp] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [completed, setCompleted] = useState(false);
  const scrollRef = useRef(null);
  const scrollOffsetY = useRef(0);
  // đệm thêm dưới đáy khi mở bàn phím để có chỗ cuộn cả nút Gửi lên (modal tính inset bị hụt)
  const [kbPad, setKbPad] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKbPad(spacing.xl * 4));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbPad(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    getExperienceById(id).then(setExp);
    // Restore persisted bookmark + check-in state
    getBookmarks(user.uid).then((ids) => setBookmarked(ids.includes(id)));
    getCompleted(user.uid).then((list) => setCompleted(list.some((c) => c.expId === id)));
    // Reload khi quay lại từ màn Sửa để thấy thay đổi ngay
    const unsub = navigation.addListener('focus', () => getExperienceById(id).then(setExp));
    return unsub;
  }, [id, user.uid]);

  if (!exp) return <ActivityIndicator style={{ flex: 1 }} />;

  const onBookmark = async () => {
    const nowBookmarked = await toggleBookmark(user.uid, id);
    setBookmarked(nowBookmarked);
  };

  // mở Google Maps chỉ đường tới địa điểm
  const openDirections = async () => {
    const { lat, lng } = exp.location ?? {};
    if (!lat || !lng) {
      Alert.alert('Thiếu tọa độ', 'Địa điểm này chưa có vị trí trên bản đồ.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert('Lỗi', 'Không mở được Google Maps trên thiết bị này.');
    }
  };

  // ← MỚI: share trải nghiệm ra ngoài app (Zalo, Messenger, SMS...)
  const onShare = async () => {
    try {
      const message = completed
        ? `Tôi vừa trải nghiệm ${exp.title} tại Random Experience! 🎉\n📍 ${exp.location?.address ?? ''}`
        : `Mình đang định thử ${exp.title} trên Random Experience, cùng đi không? 👀\n📍 ${exp.location?.address ?? ''}`;
      await Share.share({
        message,
        title: exp.title, // chỉ có tác dụng trên Android
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không chia sẻ được lúc này.');
    }
  };

  const onCheckIn = async () => {
    setCheckingIn(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền vị trí', 'Bật quyền vị trí để xác nhận có mặt nhé!');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const distance = haversineKm(
        { lat: loc.coords.latitude, lng: loc.coords.longitude },
        exp.location,
      );
      if (distance > CHECKIN_RADIUS_KM) {
        Alert.alert(
          'Chưa đến nơi rồi 😅',
          `Bạn đang cách địa điểm ${distance.toFixed(1)}km. Cần ở trong vòng 500m để xác nhận có mặt.`,
        );
        return;
      }

      // Đọc lastCompleted TRƯỚC khi ghi bản ghi mới, tránh lệch thứ tự do
      // serverTimestamp() của bản ghi vừa thêm chưa resolve kịp.
      const lastCompletedDate = await getLastCompleted(user.uid);

      await markCompleted(user.uid, id, exp.category);
      const newStreak = await updateStreak(user.uid, lastCompletedDate);
      const newBadges = await checkAndGrantBadges(user.uid, newStreak);

      setCompleted(true);

      if (newBadges.length > 0) {
        const names = newBadges.map((b) => `🏅 ${b.title}`).join('\n');
        Alert.alert('Xác nhận thành công! 🎉', `Chuỗi ngày: ${newStreak}\n\nBạn vừa đạt:\n${names}`);
      } else {
        Alert.alert('Xác nhận thành công! 🎉', `Chuỗi ngày của bạn hiện là ${newStreak}.`);
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Xóa trải nghiệm?', 'Hành động này không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExperience(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Lỗi', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.container, kbPad > 0 && { paddingBottom: kbPad }]}
        showsVerticalScrollIndicator={false}
        // đẩy nội dung lên khi mở bàn phím, không che ô nhập review (iOS)
        automaticallyAdjustKeyboardInsets
        // cho phép bấm nút Gửi ngay cả khi bàn phím đang mở
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          scrollOffsetY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Hero ảnh tràn viền + bookmark/share nổi */}
        <View style={styles.hero}>
          {exp.images?.[0] ? (
            <Image source={exp.images[0]} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.fallbackEmoji}>🗺️</Text>
            </View>
          )}
          <SafeAreaView style={styles.heroActions} edges={['top']}>
            {/* ← MỚI: nút chia sẻ, đặt cạnh bookmark */}
            <IconButton
              icon="share-variant"
              mode="contained"
              iconColor={colors.text}
              containerColor={colors.background}
              size={24}
              onPress={onShare}
              style={styles.shareBtn}
            />
            <IconButton
              icon={bookmarked ? 'bookmark' : 'bookmark-outline'}
              mode="contained"
              iconColor={bookmarked ? colors.primary : colors.text}
              containerColor={colors.background}
              size={24}
              onPress={onBookmark}
              style={styles.bookmarkBtn}
            />
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{exp.title}</Text>

          <View style={styles.row}>
            <Chip icon="tag" compact style={styles.chip}>
              {getCategoryLabel(exp.category)}
            </Chip>
            <Chip icon="cash" compact style={styles.chip}>
              {(exp.budget / 1000).toFixed(0)}k
            </Chip>
            <Chip icon="clock-outline" compact style={styles.chip}>
              {exp.duration} phút
            </Chip>
            <Chip icon="star" compact style={styles.chip}>
              {exp.rating?.toFixed(1) ?? '—'}
            </Chip>
          </View>

          <Text style={styles.desc}>{exp.description}</Text>

          <View style={styles.addressRow}>
            <Text style={styles.address}>📍 {exp.location?.address ?? 'Chưa có địa chỉ'}</Text>
          </View>

          <Button
            mode={completed ? 'contained' : 'outlined'}
            icon="map-marker-check"
            onPress={onCheckIn}
            loading={checkingIn}
            disabled={completed}
            style={styles.checkinBtn}
          >
            {completed ? '✅ Đã trải nghiệm' : 'Xác nhận có mặt'}
          </Button>

          {/* [M4] Sửa/Xóa — chỉ creator thấy (firestore.rules cũng enforce) */}
          {exp.createdBy === user.uid && (
            <View style={styles.ownerRow}>
              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => navigation.navigate('ExperienceForm', { id })}
                style={styles.ownerBtn}
              >
                Sửa
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                textColor={colors.danger}
                onPress={onDelete}
                style={styles.ownerBtn}
              >
                Xóa
              </Button>
            </View>
          )}

          {/* [M4] Review + rating */}
          <ReviewSection
            expId={id}
            userId={user.uid}
            onReviewAdded={() => getExperienceById(id).then(setExp)}
            // cuộn thêm một đoạn khi form review vẫn bị bàn phím che
            onNeedScroll={(delta) =>
              scrollRef.current?.scrollTo({
                y: scrollOffsetY.current + delta,
                animated: true,
              })
            }
          />
        </View>
      </ScrollView>

      {/* Thanh hành động cố định ở đáy */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <Button
          mode="contained"
          icon="map-marker-radius"
          onPress={openDirections}
          style={styles.directionsBtn}
          contentStyle={styles.directionsContent}
        >
          Chỉ đường trên Google Maps
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl * 2 },
  hero: { position: 'relative' },
  image: { width: '100%', height: 260 },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  fallbackEmoji: { fontSize: 56 },
  heroActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  shareBtn: { ...shadow.sm },
  bookmarkBtn: { ...shadow.sm },
  body: { padding: spacing.lg },
  title: { ...typography.title, marginBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { backgroundColor: colors.surface },
  desc: { ...typography.body, lineHeight: 22, marginBottom: spacing.lg },
  addressRow: { marginBottom: spacing.lg },
  address: { ...typography.caption, lineHeight: 18 },
  checkinBtn: { marginTop: spacing.sm, borderRadius: radius.full },
  ownerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  ownerBtn: { flex: 1 },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    // modal trên iOS không có safe-area inset dưới nên phải tự đệm đủ qua vùng home indicator (~34px)
    paddingBottom: Platform.select({ ios: spacing.xl + spacing.xs, android: spacing.md }),
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  directionsBtn: { borderRadius: radius.full },
  directionsContent: { paddingVertical: spacing.xs },
});
