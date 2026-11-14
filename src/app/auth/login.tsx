import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, type Href } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/auth-context'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Заполните поля', 'Пожалуйста, укажите email и пароль.')
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      Alert.alert('Ошибка входа', error.message || 'Проверьте введённые данные.')
    } else {
      router.replace('/(tabs)' as Href)
    }
  }

  const handleSkip = () => {
    router.replace('/(tabs)' as Href)
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Ionicons name="checkbox" size={32} color="#6C5DD3" />
            </View>
            <Text style={styles.title}>С возвращением!</Text>
            <Text style={styles.subtitle}>Войдите, чтобы синхронизировать ваши задачи</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Электронная почта</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#8E91A4" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#A1A4B5"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Пароль</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8E91A4"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ваш пароль"
                  placeholderTextColor="#A1A4B5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={10}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#8E91A4"
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              disabled={loading}
              onPress={handleSignIn}
              style={[styles.loginBtnWrap, loading && { opacity: 0.7 }]}
            >
              <LinearGradient
                colors={['#6C5DD3', '#8B7AE8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Войти в аккаунт</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Guest button */}
            <Pressable onPress={handleSkip} style={styles.guestBtn}>
              <Text style={styles.guestBtnText}>Продолжить без аккаунта (локально)</Text>
            </Pressable>
          </View>

          {/* Footer / Switch to Register */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Ещё нет аккаунта?</Text>
            <Pressable onPress={() => router.push('/auth/register' as Href)}>
              <Text style={styles.footerLink}>Зарегистрироваться</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FE',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#ECEBF3',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E1F24',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#717382',
    textAlign: 'center',
  },
  form: {
    gap: 18,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F414D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E6F0',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E1F24',
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E91A4',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#717382',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C5DD3',
  },
})

