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

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Заполните поля', 'Пожалуйста, укажите email и пароль.')
      return
    }

    if (password.length < 6) {
      Alert.alert('Слишком короткий пароль', 'Пароль должен содержать минимум 6 символов.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)

    if (error) {
      Alert.alert('Ошибка регистрации', error.message || 'Не удалось создать аккаунт.')
    } else {
      Alert.alert(
        'Успешная регистрация! 🎉',
        'Аккаунт создан. Теперь войдите с вашими данными.',
        [{ text: 'Войти', onPress: () => router.replace('/auth/login' as Href) }],
      )
    }
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
          {/* Back button */}
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Создать аккаунт</Text>
            <Text style={styles.subtitle}>
              Начните вести задачи и ставить рекорды продуктивности
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Ваше имя</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#8E91A4"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Как вас зовут?"
                  placeholderTextColor="#A1A4B5"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

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
              <Text style={styles.fieldLabel}>Пароль (минимум 6 символов)</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8E91A4"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Придумайте пароль"
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

            {/* Register Button */}
            <Pressable
              disabled={loading}
              onPress={handleSignUp}
              style={[styles.regBtnWrap, loading && { opacity: 0.7 }]}
            >
              <LinearGradient
                colors={['#6C5DD3', '#8B7AE8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.regBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.regBtnText}>Зарегистрироваться</Text>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer / Switch to Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.footerLink}>Войти</Text>
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
    gap: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#EFEFF8',
    marginBottom: 6,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1F24',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#717382',
    lineHeight: 20,
  },
  form: {
    gap: 16,
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
  regBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  regBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  regBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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

