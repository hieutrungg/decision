// [M4] Form tạo / sửa experience — route param `id` có giá trị = chế độ Edit
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  createExperience,
  updateExperience,
  getExperienceById,
  uploadExperienceImage,
} from '../../services/experienceService';
import { useAuth } from '../../hooks/useAuth';
import { CATEGORIES, MOODS, getCategoryLabel } from '../../utils/constants';
import { colors, spacing, typography, radius } from '../../utils/theme';

export default function ExperienceFormScreen({ route, navigation }) {
  const expId = route.params?.id ?? null;
  const isEdit = !!expId;
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [moods, setMoods] = useState([]);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [imageUri, setImageUri] = useState(null); // uri local mới chọn
  const [existingImage, setExistingImage] = useState(null); // URL đã có (edit mode)

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Sửa trải nghiệm' : 'Tạo trải nghiệm' });
    if (!isEdit) return;
    getExperienceById(expId).then((exp) => {
      if (!exp) {
        Alert.alert('Lỗi', 'Không tìm thấy trải nghiệm này.');
        navigation.goBack();
        return;
      }
      setTitle(exp.title ?? '');
      setDescription(exp.description ?? '');
      setCategory(exp.category ?? CATEGORIES[0]);
      setBudget(String(exp.budget ?? ''));
      setDuration(String(exp.duration ?? ''));
      setMoods(exp.mood ?? []);
      setAddress(exp.location?.address ?? '');
      if (exp.location?.lat) setCoords({ lat: exp.location.lat, lng: exp.location.lng });
      setExistingImage(exp.images?.[0] ?? null);
      setLoading(false);
    });
  }, [expId]);

  const toggleMood = (key) =>
    setMoods((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền vị trí', 'Bật quyền vị trí để lấy tọa độ địa điểm.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async () => {
    const budgetNum = Number(budget);
    const durationNum = Number(duration);
    if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên trải nghiệm nhé.');
    if (!budgetNum || budgetNum <= 0)
      return Alert.alert('Thiếu thông tin', 'Ngân sách phải là số lớn hơn 0 (VNĐ).');
    if (!durationNum || durationNum <= 0)
      return Alert.alert('Thiếu thông tin', 'Thời lượng phải là số phút lớn hơn 0.');
    if (moods.length === 0)
      return Alert.alert('Thiếu thông tin', 'Chọn ít nhất một tâm trạng cho trải nghiệm.');

    setSaving(true);
    try {
      let imageUrl = existingImage;
      if (imageUri) imageUrl = await uploadExperienceImage(imageUri);

      const data = {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: budgetNum,
        duration: durationNum,
        mood: moods,
        images: imageUrl ? [imageUrl] : [],
        location: {
          address: address.trim(),
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        },
      };

      if (isEdit) {
        await updateExperience(expId, data);
      } else {
        await createExperience({ ...data, createdBy: user.uid });
      }
      Alert.alert(isEdit ? 'Đã cập nhật! ✅' : 'Đã tạo trải nghiệm! 🎉', '', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  const previewImage = imageUri ?? existingImage;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        label="Tên trải nghiệm *"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={category === c} onPress={() => setCategory(c)} style={styles.chip}>
            {getCategoryLabel(c)}
          </Chip>
        ))}
      </View>

      <View style={styles.row2}>
        <TextInput
          label="Ngân sách (VNĐ) *"
          value={budget}
          onChangeText={setBudget}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, styles.flex1]}
        />
        <TextInput
          label="Thời lượng (phút) *"
          value={duration}
          onChangeText={setDuration}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, styles.flex1]}
        />
      </View>

      <Text style={styles.label}>Tâm trạng (chọn một hoặc nhiều) *</Text>
      <View style={styles.chipRow}>
        {MOODS.map((m) => (
          <Chip
            key={m.key}
            selected={moods.includes(m.key)}
            onPress={() => toggleMood(m.key)}
            style={styles.chip}
          >
            {m.emoji} {m.label}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Địa chỉ"
        value={address}
        onChangeText={setAddress}
        mode="outlined"
        style={styles.input}
      />
      <Button
        mode="outlined"
        icon="crosshairs-gps"
        onPress={useCurrentLocation}
        loading={locating}
        style={styles.btn}
      >
        {coords ? `📍 Đã có tọa độ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : 'Dùng vị trí hiện tại'}
      </Button>

      <Text style={styles.label}>Ảnh</Text>
      {previewImage && <Image source={previewImage} style={styles.preview} contentFit="cover" />}
      <Button mode="outlined" icon="image" onPress={pickImage} style={styles.btn}>
        {previewImage ? 'Đổi ảnh khác' : 'Chọn ảnh từ thư viện'}
      </Button>

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={saving}
        disabled={saving}
        style={styles.submit}
      >
        {isEdit ? 'Lưu thay đổi' : 'Tạo trải nghiệm'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2, backgroundColor: colors.background },
  input: { marginBottom: spacing.md },
  label: { ...typography.subtitle, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { marginRight: 0 },
  row2: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  preview: { width: '100%', height: 180, borderRadius: radius.md, marginBottom: spacing.sm },
  btn: { marginBottom: spacing.md },
  submit: { marginTop: spacing.sm },
});
