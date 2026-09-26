import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useSahayak } from '@/context/SahayakContext';
import { login, DEMO_ACCOUNTS_LIST } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setRole, setCurrentUser } = useSahayak();

  const handleLogin = async (e: string, p: string) => {
    setError(null);
    try {
      const user = await login(e, p);
      setRole(user.role);
      setCurrentUser(user);
      if (user.role === 'personnel') router.replace('/(personnel)');
      else if (user.role === 'welfare_officer') router.replace('/(welfare)');
      else if (user.role === 'command_admin') router.replace('/(command)');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const autofillAndLogin = (account: any) => {
    setEmail(account.email);
    setPassword('demo1234');
    handleLogin(account.email, 'demo1234');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>SAHAYAK</Text>
          <Text style={styles.tagline}>Personnel Welfare Intelligence Platform</Text>
        </View>

        <View style={styles.form}>
          {error && <Text style={styles.error}>{error}</Text>}
          
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your email"
          />
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
          />

          <TouchableOpacity style={styles.loginBtn} onPress={() => handleLogin(email, password)}>
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => alert('Reset link sent')}>
            <Text style={styles.forgotBtnText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>DEMO ACCOUNTS</Text>
          {DEMO_ACCOUNTS_LIST.map((acc, i) => (
            <TouchableOpacity key={i} style={styles.demoBtn} onPress={() => autofillAndLogin(acc)}>
              <Text style={styles.demoBtnText}>
                {acc.role === 'personnel' ? 'Personnel' : acc.role === 'welfare_officer' ? 'Welfare Officer' : 'Command'} ({acc.name.split(' ')[0]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flexGrow: 1, padding: Spacing.six, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: Spacing.ten },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.four },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.light.navy, letterSpacing: 1 },
  tagline: { fontSize: 14, color: Colors.light.textSecondary, marginTop: Spacing.one },
  form: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.six, borderRadius: Radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  error: { color: Colors.light.stateSustained, marginBottom: Spacing.four, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: Spacing.two },
  input: { borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.md, padding: Spacing.three, fontSize: 16, marginBottom: Spacing.four },
  loginBtn: { backgroundColor: Colors.light.primary, padding: Spacing.four, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.two },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  forgotBtn: { alignItems: 'center', marginTop: Spacing.four },
  forgotBtnText: { color: Colors.light.primary, fontSize: 14, fontWeight: '500' },
  demoSection: { marginTop: Spacing.eight, padding: Spacing.four, backgroundColor: Colors.light.backgroundSelected, borderRadius: Radius.lg },
  demoTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.light.textMuted, marginBottom: Spacing.four, letterSpacing: 1, textAlign: 'center' },
  demoBtn: { backgroundColor: Colors.light.backgroundElement, padding: Spacing.three, borderRadius: Radius.md, marginBottom: Spacing.two, borderWidth: 1, borderColor: Colors.light.border },
  demoBtnText: { textAlign: 'center', color: Colors.light.navy, fontWeight: '500' },
});
