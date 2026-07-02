// [M4] Chi tiết experience: ảnh, mô tả, rating, bookmark, chỉ đường, check-in
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Linking } from 'react-native';
import { Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { getExperienceById, toggleBookmark } from '../../services/experienceService';
import {
  markCompleted,
  updateStreak,
  getLastCompleted,
  checkAndGrantBadges,
} from '../../services/socialService';
import { haversineKm } from '../../api/maps';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, radius } from '../../utils/theme';

const CHECKIN_RADIUS_KM = 0.5; // 500m

export default function ExperienceDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [exp, setExp] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    getExperienceById(id).then(setExp);
  }, [id]);

  if (!exp) return <ActivityIndicator style={{ flex: 1 }} />;

  const onBookmark = async () => {
    const nowBookmarked = await toggleBookmark(user.uid, id);
    setBookmarked(nowBookmarked);
  };

  // ← MỚI: mở Google Maps chỉ đường tới địa điểm
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

  const onCheckIn = async () => {
    setCheckingIn(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền vị trí', 'Bật quyền vị trí để check-in nhé!');
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
          `Bạn đang cách địa điểm ${distance.toFixed(1)}km. Cần ở trong vòng 500m để check-in.`,
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
        Alert.alert('Check-in thành công! 🎉', `Streak: ${newStreak}\n\nBạn vừa đạt:\n${names}`);
      } else {
        Alert.alert('Check-in thành công! 🎉', `Streak của bạn hiện là ${newStreak}.`);
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setCheckingIn(false);
    }
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

      {/* ← MỚI: nút chỉ đường */}
      <Button mode="contained" icon="map-marker-radius" onPress={openDirections}>
        Chỉ đường trên Google Maps
      </Button>

      <Button
        mode={bookmarked ? 'contained' : 'outlined'}
        icon="bookmark"
        onPress={onBookmark}
        style={styles.btn}
      >
        {bookmarked ? 'Đã lưu' : 'Lưu vào Wishlist'}
      </Button>

      <Button
        mode="outlined"
        icon="map-marker-check"
        onPress={onCheckIn}
        loading={checkingIn}
        disabled={completed}
        style={styles.btn}
      >
        {completed ? '✅ Đã trải nghiệm' : 'Check-in tại đây'}
      </Button>

      {/* TODO [M4]: danh sách review + form viết review */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  image: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.md },
  title: { ...typography.title, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  desc: { ...typography.body, marginBottom: spacing.md },
  address: { ...typography.caption, marginBottom: spacing.lg },
  btn: { marginTop: spacing.sm },
});
