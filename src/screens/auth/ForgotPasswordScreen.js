// [M1.3] Quên mật khẩu — gửi email reset qua Firebase
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../api/firebase';
import { colors, spacing, typography } from '../../utils/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSend = async () => {
    const value = email.trim();
    if (!value) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError('Email không hợp lệ.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, value);
      setSent(true);
    } catch (e) {
      // Phân biệt lỗi để báo cho đúng
      if (e?.code === 'auth/user-not-found') {
        setError('Không tìm thấy tài khoản với email này.');
      } else if (e?.code === 'auth/invalid-email') {
        setError('Email không hợp lệ.');
      } else if (e?.code === 'auth/too-many-requests') {
        setError('Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.');
      } else if (e?.code === 'auth/network-request-failed') {
        setError('Lỗi mạng. Kiểm tra kết nối internet và thử lại.');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Brand */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{sent ? '📬' : '🔑'}</Text>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'Đã gửi link đặt lại mật khẩu cho bạn'
              : 'Nhập email tài khoản — chúng tôi sẽ gửi link đặt lại mật khẩu'}
          </Text>
        </View>

        {sent ? (
          /* Trạng thái đã gửi */
          <View style={styles.form}>
            <Text style={styles.success}>
              ✅ Đã gửi email đặt lại mật khẩu tới{'\n'}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>
            </Text>
            <Text style={styles.note}>
              Kiểm tra hộp thư của bạn (kể cả mục Spam/Quảng cáo) và làm theo
              hướng dẫn trong email nhé!
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={styles.primaryBtn}
              contentStyle={styles.btnContent}
            >
              Quay lại đăng nhập
            </Button>
            <Button onPress={() => { setSent(false); setError(''); }}>
              Gửi lại cho email khác
            </Button>
          </View>
        ) : (
          /* Form nhập email */
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              autoCapitalize="none"
              autoFocus
              keyboardType="email-address"
              returnKeyType="send"
              onSubmitEditing={onSend}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Button
              mode="contained"
              onPress={onSend}
              loading={loading}
              disabled={loading}
              style={styles.primaryBtn}
              contentStyle={styles.btnContent}
            >
              Gửi email đặt lại
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Nhớ ra mật khẩu rồi? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  emoji: { fontSize: 52, marginBottom: spacing.sm },
  title: { ...typography.title, color: colors.primary, textAlign: 'center' },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  form: { gap: spacing.sm },
  input: { backgroundColor: colors.background },
  error: { color: colors.danger, fontSize: 13, marginTop: -spacing.xs },
  primaryBtn: { marginTop: spacing.sm, borderRadius: 10 },
  btnContent: { paddingVertical: spacing.xs },
  success: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emailHighlight: { fontWeight: '700', color: colors.primary },
  note: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
