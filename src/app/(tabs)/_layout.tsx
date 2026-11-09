import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';

function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6C5DD3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          shadowOpacity: 0.1,
          elevation: 10,
        },
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? 'gray' : color ?? 'gray'}
              name={focused ? 'home' : 'home-outline'}
            />
          ),
        }}
      />
            <Tabs.Screen
        name="calender"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? 'gray' : color ?? 'gray'}
              name={focused ? 'calendar' : 'calendar-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="statistic"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? 'gray' : color ?? 'gray'}
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
            />
          ),
        }}
      />
         <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              color={typeof color === 'number' ? 'gray' : color ?? 'gray'}
              name={focused ? 'person-circle-outline' : 'person-circle-outline'}
            />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout