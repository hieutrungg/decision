// [M1] Màn hình đăng ký
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, colors } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const onRegister = async () => {
    if (!displayName.trim()) { setError('Vui lòng nhập tên hiển thị.'); return; }
    if (!email.trim()) { setError('Vui lòng nhập email.'); return; }
    if (password.length < 6) { setError('Mật khẩu cần ít nhất 6 ký tự.'); return; }
    if (password !== confirmPassword) { setError('Mật khẩu nhập lại không khớp.'); return; }
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (e) {
      setError('Đăng ký thất bại — email có thể đã được dùng.');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Bắt đầu hành trình khám phá của bạn</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Tên hiển thị"
            value={displayName}
            onChangeText={(v) => { setDisplayName(v); setError(''); }}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" />}
            style={styles.input}
          />
          <TextInput
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            mode="outlined"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
          />
          <TextInput
            ref={passwordRef}
            label="Mật khẩu"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(''); }}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            mode="outlined"
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword((s) => !s)}
              />
            }
            style={styles.input}
          />
          <TextInput
            ref={confirmPasswordRef}
            label="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
            secureTextEntry={!showConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={onRegister}
            mode="outlined"
            left={<TextInput.Icon icon="lock-check-outline" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowConfirmPassword((s) => !s)}
              />
            }
            style={styles.input}
          />

          <HelperText type="info" style={styles.hint}>
            Mật khẩu ít nhất 6 ký tự
          </HelperText>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Button
            mode="contained"
            onPress={onRegister}
            loading={loading}
            disabled={loading}
            style={styles.primaryBtn}
            contentStyle={styles.btnContent}
          >
            Tạo tài khoản
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
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
  title: { ...typography.title, textAlign: 'center' },
  subtitle: { ...typography.caption, textAlign: 'center', marginTop: spacing.xs },
  form: { gap: spacing.sm },
  input: { backgroundColor: colors.background },
  hint: { marginTop: -spacing.sm, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 13 },
  primaryBtn: { marginTop: spacing.sm, borderRadius: 10 },
  btnContent: { paddingVertical: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
