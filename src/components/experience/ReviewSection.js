// [M4] Danh sách review + form viết review — dùng trong ExperienceDetailScreen
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Alert, Keyboard } from 'react-native';
import { Text, TextInput, Button, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { addReview, getReviews } from '../../services/experienceService';
import { colors, spacing, typography, radius } from '../../utils/theme';

function Stars({ value, size = 18, onChange }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconButton
          key={i}
          icon={i <= value ? 'star' : 'star-outline'}
          iconColor={colors.primary}
          size={size}
          style={styles.starBtn}
          disabled={!onChange}
          onPress={onChange ? () => onChange(i) : undefined}
        />
      ))}
    </View>
  );
}

export default function ReviewSection({ expId, userId, onReviewAdded, onNeedScroll }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);
  const inputFocused = useRef(false);

  // Bàn phím mở xong thì đo lại: nếu form (cả nút Gửi) vẫn bị che thì nhờ parent cuộn bù.
  // Phải tự đo vì màn Detail là modal — inset tự động của ScrollView tính lệch một đoạn.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      if (!inputFocused.current) return;
      // chờ ScrollView cuộn tự động xong rồi mới đo, tránh đo giữa chừng animation
      setTimeout(() => {
        formRef.current?.measureInWindow((x, y, w, h) => {
          const overlap = y + h - e.endCoordinates.screenY;
          if (overlap > 0) onNeedScroll?.(overlap + spacing.md);
        });
      }, 100);
    });
    return () => sub.remove();
  }, [onNeedScroll]);

  const load = useCallback(async () => {
    const list = await getReviews(expId);
    setReviews(list);
    setLoading(false);
  }, [expId]);

  useEffect(() => {
    load();
  }, [load]);

  const alreadyReviewed = reviews.some((r) => r.userId === userId);

  const onSubmit = async () => {
    if (rating < 1) return Alert.alert('Thiếu đánh giá', 'Chọn số sao trước đã nhé (1–5).');
    setSending(true);
    try {
      await addReview(expId, userId, rating, comment.trim());
      setRating(0);
      setComment('');
      await load();
      onReviewAdded?.();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Đánh giá ({reviews.length})</Text>

      {alreadyReviewed ? (
        <Text style={styles.reviewed}>✅ Bạn đã đánh giá experience này</Text>
      ) : (
        <View style={styles.form} ref={formRef}>
          <Stars value={rating} size={26} onChange={setRating} />
          <TextInput
            placeholder="Chia sẻ trải nghiệm của bạn..."
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline
            dense
            style={styles.input}
            onFocus={() => (inputFocused.current = true)}
            onBlur={() => (inputFocused.current = false)}
          />
          <Button mode="contained" onPress={onSubmit} loading={sending} disabled={sending}>
            Gửi đánh giá
          </Button>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.md }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>Chưa có đánh giá nào — hãy là người đầu tiên!</Text>
      ) : (
        reviews.map((r, idx) => (
          <View key={r.id}>
            {idx > 0 && <Divider style={styles.divider} />}
            <View style={styles.item}>
              <View style={styles.itemHeader}>
                <Stars value={r.rating} size={14} />
                <Text style={styles.date}>
                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('vi-VN') : ''}
                </Text>
              </View>
              {!!r.comment && <Text style={styles.comment}>{r.comment}</Text>}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  heading: { ...typography.subtitle, marginBottom: spacing.sm },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  input: { marginVertical: spacing.sm, backgroundColor: colors.background },
  reviewed: { ...typography.body, color: colors.success, marginBottom: spacing.md },
  starRow: { flexDirection: 'row' },
  starBtn: { margin: 0, width: 30 },
  empty: { ...typography.caption, marginTop: spacing.sm },
  item: { paddingVertical: spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { ...typography.caption },
  comment: { ...typography.body, marginTop: spacing.xs },
  divider: { backgroundColor: colors.border },
});
