// src/api/cloudinary.js
// [M4] Upload ảnh experience lên Cloudinary bằng unsigned preset.
// cloudName + uploadPreset là giá trị công khai (không phải secret) — an toàn để commit.
// KHÔNG bao giờ đặt API Secret của Cloudinary vào client.
const CLOUD_NAME = 'acjsvrgv';
const UPLOAD_PRESET = 'decision';

/**
 * Đẩy ảnh local (uri từ expo-image-picker) lên Cloudinary, trả về URL ảnh đã host.
 * Dùng unsigned upload nên không cần API key/secret.
 */
export async function uploadImageToCloudinary(localUri) {
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: `experience_${Date.now()}.jpg`,
  });
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'Upload ảnh thất bại');
  }
  return data.secure_url;
}
