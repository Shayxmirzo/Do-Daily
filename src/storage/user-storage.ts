import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../api/supabase'
import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  name: string
  email: string
  bio: string
  avatarEmoji: string
  dailyGoal: number
  notificationsEnabled: boolean
  soundsEnabled: boolean
  xp?: number
  streak?: number
}

const USER_PROFILE_KEY = 'user_profile'

export const defaultUserProfile: UserProfile = {
  name: 'Пользователь',
  email: '',
  bio: 'Каждый день — шаг к поставленной цели 🎯',
  avatarEmoji: '⚡',
  dailyGoal: 5,
  notificationsEnabled: true,
  soundsEnabled: true,
  xp: 0,
  streak: 0,
}

export async function loadUserProfile(user?: User | null): Promise<UserProfile> {
  let profile = defaultUserProfile

  // 1. Read local cache first
  const raw = await AsyncStorage.getItem(USER_PROFILE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<UserProfile>
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        profile = {
          name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : defaultUserProfile.name,
          email: typeof parsed.email === 'string' ? parsed.email : defaultUserProfile.email,
          bio: typeof parsed.bio === 'string' ? parsed.bio : defaultUserProfile.bio,
          avatarEmoji: typeof parsed.avatarEmoji === 'string' ? parsed.avatarEmoji : defaultUserProfile.avatarEmoji,
          dailyGoal: typeof parsed.dailyGoal === 'number' && parsed.dailyGoal >= 1 && parsed.dailyGoal <= 30
            ? parsed.dailyGoal
            : defaultUserProfile.dailyGoal,
          notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean'
            ? parsed.notificationsEnabled
            : defaultUserProfile.notificationsEnabled,
          soundsEnabled: typeof parsed.soundsEnabled === 'boolean'
            ? parsed.soundsEnabled
            : defaultUserProfile.soundsEnabled,
          xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
          streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
        }
      }
    } catch {
      // ignore parse error, fallback to default
    }
  }

  // If user metadata has a name and local is default
  if (user?.user_metadata?.name && profile.name === defaultUserProfile.name) {
    profile.name = user.user_metadata.name
  }
  if (user?.email && !profile.email) {
    profile.email = user.email
  }

  // 2. If logged in, fetch latest from Supabase
  if (user?.id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        profile = {
          name: data.name || profile.name,
          email: data.email || user.email || profile.email,
          bio: data.bio ?? profile.bio,
          avatarEmoji: data.avatar_emoji || profile.avatarEmoji,
          dailyGoal: data.daily_goal ?? profile.dailyGoal,
          notificationsEnabled: data.notifications_enabled ?? profile.notificationsEnabled,
          soundsEnabled: data.sounds_enabled ?? profile.soundsEnabled,
          xp: data.xp ?? profile.xp,
          streak: data.streak ?? profile.streak,
        }
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
      }
    } catch {
      // Network/offline error: stay with cached profile
    }
  }

  return profile
}

export async function saveUserProfile(profile: UserProfile, user?: User | null): Promise<void> {
  // Save locally
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))

  // Sync to Supabase if logged in
  if (user?.id) {
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          email: profile.email || user.email,
          bio: profile.bio,
          avatar_emoji: profile.avatarEmoji,
          daily_goal: profile.dailyGoal,
          notifications_enabled: profile.notificationsEnabled,
          sounds_enabled: profile.soundsEnabled,
          updated_at: new Date().toISOString(),
        })
    } catch {
      // Ignore network sync error, local changes are preserved
    }
  }
}

export async function resetUserProfile(): Promise<UserProfile> {
  await AsyncStorage.removeItem(USER_PROFILE_KEY)
  return defaultUserProfile
}

