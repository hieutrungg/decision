// [M1] Màn hình đăng nhập
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      // RootNavigator tự chuyển sang MainTabs khi auth state đổi
    } catch (e) {
      setError('Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Random Experience</Text>
      <Text style={styles.subtitle}>Tìm nơi bạn chưa từng nghĩ tới</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button mode="contained" onPress={onLogin} loading={loading} style={styles.button}>
        Đăng nhập
      </Button>
      <Button onPress={() => navigation.navigate('Register')}>Chưa có tài khoản? Đăng ký</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.title, textAlign: 'center', color: colors.primary },
  subtitle: { ...typography.caption, textAlign: 'center', marginBottom: spacing.xl },
  input: { marginBottom: spacing.md },
  button: { marginTop: spacing.sm, marginBottom: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
