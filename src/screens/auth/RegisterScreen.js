// [M1] Màn hình đăng ký
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { spacing, typography, colors } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (e) {
      setError('Đăng ký thất bại — email có thể đã được dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <TextInput label="Tên hiển thị" value={displayName} onChangeText={setDisplayName} style={styles.input} />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button mode="contained" onPress={onRegister} loading={loading} style={styles.button}>
        Đăng ký
      </Button>
      <Button onPress={() => navigation.goBack()}>Đã có tài khoản? Đăng nhập</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.title, textAlign: 'center', marginBottom: spacing.xl },
  input: { marginBottom: spacing.md },
  button: { marginTop: spacing.sm, marginBottom: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
