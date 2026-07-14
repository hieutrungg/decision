// [M4] Form tạo / sửa experience — route param `id` có giá trị = chế độ Edit
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  Keyboard,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, TextInput, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  createExperience,
  updateExperience,
  getExperienceById,
  uploadExperienceImage,
} from '../../services/experienceService';
import { useAuth } from '../../hooks/useAuth';
import {
  CATEGORIES,
  MOODS,
  TIME_SLOTS,
  getCategoryLabel,
  DEFAULT_MAP_REGION,
} from '../../utils/constants';
import { colors, spacing, typography, radius } from '../../utils/theme';

// giá trị chip "Khác" — không nằm trong CATEGORIES để các màn filter không bị lẫn
const OTHER_CATEGORY = '__other__';

export default function ExperienceFormScreen({ route, navigation }) {
  const expId = route.params?.id ?? null;
  const isEdit = !!expId;
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState(''); // khi chọn "Khác"
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [moods, setMoods] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]); // rỗng = phù hợp mọi khung giờ
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [suggestedAddress, setSuggestedAddress] = useState(null); // địa chỉ đầy đủ tra từ ghim
  const [imageUri, setImageUri] = useState(null); // uri local mới chọn
  const [existingImage, setExistingImage] = useState(null); // URL đã có (edit mode)
  const mapRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollY = useRef(0);

  // Auto-scroll có sẵn của RN (kiến trúc mới) đang cuộn quá đà làm mất ô input.
  // Tự xử: bàn phím mở xong thì đo vị trí ô đang focus rồi cuộn về đúng chỗ —
  // bị che thì kéo lên vừa đủ, bị đẩy quá cao thì kéo ngược xuống.
  // (Không đệm thêm đáy như màn Detail — dưới ô input cuối của form còn cả khối
  // bản đồ + nút nên luôn đủ chỗ cuộn; đệm thừa gây ra khoảng trống dài khó kéo lại.)
  useEffect(() => {
    const HEADER_SAFE = 120; // không để input chui lên sát header
    const KB_MARGIN = 24; // lề cách mép bàn phím

    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      // chờ cú cuộn tự động của RN chạy xong rồi mới đo và sửa lại
      setTimeout(() => {
        const input = RNTextInput.State.currentlyFocusedInput();
        if (!input) return;
        input.measureInWindow((x, y, w, h) => {
          const kbTop = e.endCoordinates.screenY;
          let delta = 0;
          if (y + h > kbTop - KB_MARGIN) {
            delta = y + h - (kbTop - KB_MARGIN); // input bị bàn phím che → cuộn lên
          } else if (y < HEADER_SAFE) {
            delta = y - HEADER_SAFE; // bị cuộn quá đà lên cao → cuộn ngược xuống (delta âm)
          }
          if (delta !== 0) {
            scrollRef.current?.scrollTo({
              y: Math.max(0, scrollY.current + delta),
              animated: true,
            });
          }
        });
      }, 250);
    });
    return () => show.remove();
  }, []);

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
      // danh mục cũ là loại user tự nhập (không có trong danh sách) → chọn chip "Khác" và điền lại
      const cat = exp.category ?? CATEGORIES[0];
      if (CATEGORIES.includes(cat)) {
        setCategory(cat);
      } else {
        setCategory(OTHER_CATEGORY);
        setCustomCategory(cat);
      }
      setBudget(String(exp.budget ?? ''));
      setDuration(String(exp.duration ?? ''));
      setMoods(exp.mood ?? []);
      setTimeSlots(exp.timeSlots ?? []);
      setAddress(exp.location?.address ?? '');
      if (exp.location?.lat) setCoords({ lat: exp.location.lat, lng: exp.location.lng });
      setExistingImage(exp.images?.[0] ?? null);
      setLoading(false);
    });
  }, [expId]);

  // Mở form Sửa: map mount xong thì đưa camera về vị trí đã lưu
  // (chỉ chạy khi loading đổi lúc mở form — KHÔNG phụ thuộc coords, tránh giật camera mỗi lần chỉnh ghim)
  useEffect(() => {
    if (!loading && coords) {
      mapRef.current?.animateToRegion(
        { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        0,
      );
    }
  }, [loading]);

  const toggleMood = (key) =>
    setMoods((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  const toggleTimeSlot = (key) =>
    setTimeSlots((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Ghép các mảnh reverse geocode thành địa chỉ dễ đọc: "85 Phố Thái Hà, Đống Đa, Hà Nội"
  const buildAddress = (g) => {
    const parts = [];
    if (g.name) parts.push(g.name);
    // name thường đã chứa số nhà + tên đường — chỉ thêm street nếu chưa có
    if (g.street && !(g.name ?? '').includes(g.street)) {
      parts.push(g.streetNumber ? `${g.streetNumber} ${g.street}` : g.street);
    }
    const district = g.district ?? g.subregion;
    if (district) parts.push(district);
    const city = g.city ?? g.region;
    if (city) parts.push(city);
    return parts.filter(Boolean).join(', ');
  };

  // Mọi đường đặt ghim đều đi qua đây: lưu tọa độ + tra ngược địa chỉ đầy đủ để gợi ý
  const setPin = async (lat, lng) => {
    setCoords({ lat, lng });
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      setSuggestedAddress(geo ? buildAddress(geo) : null);
    } catch {
      setSuggestedAddress(null); // tra không được thì thôi, không làm phiền user
    }
  };

  // đặt ghim + trượt bản đồ tới vị trí mới
  const moveTo = (lat, lng) => {
    setPin(lat, lng);
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      350,
    );
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
      moveTo(loc.coords.latitude, loc.coords.longitude);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLocating(false);
    }
  };

  // geocode địa chỉ đã gõ → ghim lên bản đồ (user kéo ghim để tinh chỉnh)
  const searchAddressOnMap = async () => {
    if (!address.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Nhập địa chỉ trước rồi bấm tìm trên bản đồ nhé.');
      return;
    }
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(address.trim());
      if (results.length === 0) {
        Alert.alert('Không tìm thấy', 'Thử nhập chi tiết hơn (kèm quận/huyện, thành phố).');
        return;
      }
      moveTo(results[0].latitude, results[0].longitude);
    } catch (e) {
      Alert.alert('Lỗi', 'Không tìm được địa chỉ này, thử lại sau.');
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async () => {
    const budgetNum = Number(budget);
    const durationNum = Number(duration);
    if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên trải nghiệm nhé.');
    if (category === OTHER_CATEGORY && !customCategory.trim())
      return Alert.alert('Thiếu thông tin', 'Nhập tên danh mục của bạn nhé.');
    if (!budgetNum || budgetNum <= 0)
      return Alert.alert('Thiếu thông tin', 'Ngân sách phải là số lớn hơn 0 (VNĐ).');
    if (!durationNum || durationNum <= 0)
      return Alert.alert('Thiếu thông tin', 'Thời lượng phải là số phút lớn hơn 0.');
    if (moods.length === 0)
      return Alert.alert('Thiếu thông tin', 'Chọn ít nhất một tâm trạng cho trải nghiệm.');
    if (timeSlots.length === 0)
      return Alert.alert('Thiếu thông tin', 'Chọn ít nhất một khung giờ phù hợp.');
    if (!address.trim())
      return Alert.alert('Thiếu thông tin', 'Nhập địa chỉ của địa điểm nhé.');

    setSaving(true);
    try {
      let imageUrl = existingImage;
      if (imageUri) imageUrl = await uploadExperienceImage(imageUri);

      const data = {
        title: title.trim(),
        description: description.trim(),
        category: category === OTHER_CATEGORY ? customCategory.trim() : category,
        budget: budgetNum,
        duration: durationNum,
        mood: moods,
        timeSlots, // validate đã đảm bảo ≥1 buổi (data seed cũ không có field này = mọi khung giờ)
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
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      onScroll={(e) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
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
        <Chip
          selected={category === OTHER_CATEGORY}
          onPress={() => setCategory(OTHER_CATEGORY)}
          style={styles.chip}
        >
          ✏️ Khác
        </Chip>
      </View>
      {category === OTHER_CATEGORY && (
        <TextInput
          label="Danh mục của bạn *"
          value={customCategory}
          onChangeText={setCustomCategory}
          mode="outlined"
          style={styles.input}
        />
      )}

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

      <Text style={styles.label}>Khung giờ phù hợp (chọn một hoặc nhiều) *</Text>
      <View style={styles.chipRow}>
        {TIME_SLOTS.map((t) => (
          <Chip
            key={t.key}
            selected={timeSlots.includes(t.key)}
            onPress={() => toggleTimeSlot(t.key)}
            style={styles.chip}
          >
            {t.emoji} {t.label}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Địa chỉ *"
        value={address}
        // multiline để địa chỉ dài tự xuống dòng trong khung (1 dòng bị tràn vỡ viền);
        // chặn ký tự xuống dòng để data địa chỉ luôn là 1 chuỗi phẳng
        onChangeText={(t) => setAddress(t.replace(/\n/g, ' '))}
        mode="outlined"
        multiline
        style={styles.input}
      />
      <View style={styles.locationRow}>
        <Button
          mode="outlined"
          icon="map-search-outline"
          onPress={searchAddressOnMap}
          loading={searching}
          style={styles.flex1}
          compact
        >
          Tìm trên bản đồ
        </Button>
        <Button
          mode="outlined"
          icon="crosshairs-gps"
          onPress={useCurrentLocation}
          loading={locating}
          style={styles.flex1}
          compact
        >
          Vị trí hiện tại
        </Button>
      </View>

      {/* Bản đồ chọn vị trí: chạm để đặt ghim, kéo ghim để tinh chỉnh tọa độ */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          // PHẢI là object cố định — tạo object mới mỗi render sẽ gây vòng lặp
          // "maximum update depth" của react-native-maps trên kiến trúc mới
          initialRegion={DEFAULT_MAP_REGION}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            // setState ngay trong callback sự kiện của map gây vòng lặp update
            // trên kiến trúc mới → đẩy sang frame kế tiếp
            requestAnimationFrame(() => setPin(latitude, longitude));
          }}
        >
          {/* Marker luôn mounted (ẩn bằng opacity khi chưa có tọa độ) —
              mount/unmount con của MapView trên kiến trúc mới gây "maximum update depth" */}
          <Marker
            coordinate={{
              latitude: coords?.lat ?? DEFAULT_MAP_REGION.latitude,
              longitude: coords?.lng ?? DEFAULT_MAP_REGION.longitude,
            }}
            opacity={coords ? 1 : 0}
            draggable={!!coords}
            tracksViewChanges={false}
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              requestAnimationFrame(() => setPin(latitude, longitude));
            }}
          />
        </MapView>
      </View>
      <Text style={styles.mapHint}>
        {coords
          ? `📍 (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}) — chạm bản đồ hoặc kéo ghim để chỉnh`
          : 'Tìm địa chỉ hoặc chạm lên bản đồ để đặt ghim vị trí'}
      </Text>

      {/* Địa chỉ đầy đủ tra ngược từ ghim — bấm để điền vào ô địa chỉ */}
      {!!suggestedAddress && suggestedAddress !== address.trim() && (
        <View style={styles.suggestRow}>
          <Text style={styles.suggestText} numberOfLines={2}>
            📮 {suggestedAddress}
          </Text>
          <Button mode="text" compact onPress={() => setAddress(suggestedAddress)}>
            Dùng địa chỉ này
          </Button>
        </View>
      )}

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
  locationRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  mapWrap: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
  map: { width: '100%', height: 220 },
  mapHint: { ...typography.caption, marginBottom: spacing.sm },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  suggestText: { ...typography.caption, flex: 1, marginRight: spacing.sm },
  preview: { width: '100%', height: 180, borderRadius: radius.md, marginBottom: spacing.sm },
  btn: { marginBottom: spacing.md },
  submit: { marginTop: spacing.sm },
});
