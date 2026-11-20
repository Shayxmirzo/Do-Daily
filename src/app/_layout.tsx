import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { useColorScheme } from 'react-native'
import { AuthProvider } from '../context/auth-context'
import { TaskProvider } from '../context/task-context'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <TaskProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
