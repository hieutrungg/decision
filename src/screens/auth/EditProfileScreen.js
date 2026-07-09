// [M1.2] Sửa hồ sơ: displayName + avatar (upload Storage hoặc nhập URL thủ công)
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../api/firebase';
import { updateUserProfile } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../context/UserContext';
import { spacing, typography } from '../../utils/theme';

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const { profile } = useUser();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const pickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền thư viện ảnh', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      setAvatarUrl(url);
      setShowManualUrl(false);
    } catch (e) {
      // Blob upload hay lỗi trên Expo Go — cho phép nhập URL thủ công
      Alert.alert(
        'Upload thất bại',
        'Expo Go đôi khi không hỗ trợ upload blob. Bạn có thể nhập URL ảnh trực tiếp.',
        [
          { text: 'Nhập URL', onPress: () => setShowManualUrl(true) },
          { text: 'Bỏ qua', style: 'cancel' },
        ],
      );
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Thiếu tên', 'Vui lòng nhập tên hiển thị.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        displayNameLower: displayName.trim().toLowerCase(),
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || profile?.displayName || '?')[0].toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarRow}>
        {avatarUrl ? (
          <Avatar.Image size={88} source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Text size={88} label={initials} />
        )}
        <Button
          mode="outlined"
          icon="camera"
          onPress={pickAndUpload}
          loading={uploading}
          disabled={uploading}
          style={styles.avatarBtn}
        >
          Chọn ảnh
        </Button>
      </View>

      {showManualUrl && (
        <TextInput
          label="URL ảnh đại diện"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          mode="outlined"
          autoCapitalize="none"
          style={styles.input}
        />
      )}

      <TextInput
        label="Tên hiển thị"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving || uploading}
        style={styles.saveBtn}
      >
        Lưu hồ sơ
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  avatarRow: { alignItems: 'center', marginBottom: spacing.lg },
  avatarBtn: { marginTop: spacing.md },
  input: { marginBottom: spacing.md },
  saveBtn: { marginTop: spacing.sm },
});
