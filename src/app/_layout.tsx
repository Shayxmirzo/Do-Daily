import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { useColorScheme } from 'react-native'
import { AuthProvider } from '../context/auth-context'
import { TaskProvider } from '../context/task-context'
import { UserProfileProvider } from '../context/user-profile-context'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <UserProfileProvider>
          <TaskProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </TaskProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
