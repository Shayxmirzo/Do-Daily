import { Redirect, Tabs, type Href } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../../context/auth-context'

function TabsLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAF9FE',
        }}
      >
        <ActivityIndicator size="large" color="#6C5DD3" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href={'/auth/login' as Href} />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6C5DD3',
        tabBarInactiveTintColor: '#8E91A4',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0EFF5',
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? '#8E91A4' : color ?? '#8E91A4'}
              name={focused ? 'home' : 'home-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calender"
        options={{
          title: 'Календарь',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? '#8E91A4' : color ?? '#8E91A4'}
              name={focused ? 'calendar' : 'calendar-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Категории',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? '#8E91A4' : color ?? '#8E91A4'}
              name={focused ? 'grid' : 'grid-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="statistic"
        options={{
          title: 'Статистика',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? '#8E91A4' : color ?? '#8E91A4'}
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? '#8E91A4' : color ?? '#8E91A4'}
              name={focused ? 'person' : 'person-outline'}
            />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
