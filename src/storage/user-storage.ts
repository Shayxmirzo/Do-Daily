import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../api/supabase'

export type UserProfile = {
  name: string
  email: string
  bio: string
  avatarEmoji: string
  dailyGoal: number
  notificationsEnabled: boolean
  soundsEnabled: boolean
}

const USER_PROFILE_KEY = 'user_profile'

interface SupabaseProfileRow {
  name: string
  email: string | null
  bio: string | null
  avatar_emoji: string
  daily_goal: number
  notifications_enabled: boolean
  sounds_enabled: boolean
}

function getUserProfileKey(userId?: string): string {
  return userId ? `${USER_PROFILE_KEY}:${userId}` : USER_PROFILE_KEY
}

export const defaultUserProfile: UserProfile = {
  name: 'Алексей Смирнов',
  email: 'alex.daily@example.com',
  bio: 'Каждый день — шаг к поставленной цели 🎯',
  avatarEmoji: '⚡',
  dailyGoal: 5,
  notificationsEnabled: true,
  soundsEnabled: true,
}

function parseUserProfile(raw: string | null): UserProfile {
  if (!raw) {
    return defaultUserProfile
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Saved profile could not be read because the stored data is invalid.')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Saved profile could not be read because the stored data has an invalid format.')
  }

  const savedProfile = parsed as Partial<UserProfile>
  const dailyGoal = savedProfile.dailyGoal
  return {
    name: typeof savedProfile.name === 'string' && savedProfile.name.trim()
      ? savedProfile.name
      : defaultUserProfile.name,
    email: typeof savedProfile.email === 'string'
      ? savedProfile.email
      : defaultUserProfile.email,
    bio: typeof savedProfile.bio === 'string'
      ? savedProfile.bio
      : defaultUserProfile.bio,
    avatarEmoji: typeof savedProfile.avatarEmoji === 'string'
      ? savedProfile.avatarEmoji
      : defaultUserProfile.avatarEmoji,
    dailyGoal: typeof dailyGoal === 'number' &&
      Number.isInteger(dailyGoal) &&
      dailyGoal >= 1 &&
      dailyGoal <= 30
      ? dailyGoal
      : defaultUserProfile.dailyGoal,
    notificationsEnabled: typeof savedProfile.notificationsEnabled === 'boolean'
      ? savedProfile.notificationsEnabled
      : defaultUserProfile.notificationsEnabled,
    soundsEnabled: typeof savedProfile.soundsEnabled === 'boolean'
      ? savedProfile.soundsEnabled
      : defaultUserProfile.soundsEnabled,
  }
}

function mapSupabaseProfile(row: SupabaseProfileRow): UserProfile {
  return {
    name: row.name,
    email: row.email ?? '',
    bio: row.bio ?? '',
    avatarEmoji: row.avatar_emoji,
    dailyGoal: row.daily_goal,
    notificationsEnabled: row.notifications_enabled,
    soundsEnabled: row.sounds_enabled,
  }
}

export async function loadUserProfile(userId?: string): Promise<UserProfile> {
  if (!userId) {
    return parseUserProfile(await AsyncStorage.getItem(getUserProfileKey()))
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'name, email, bio, avatar_emoji, daily_goal, notifications_enabled, sounds_enabled',
    )
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load profile from Supabase: ${error.message}`)
  }
  if (!data) {
    throw new Error('No Supabase profile exists for the signed-in user.')
  }

  const profile = mapSupabaseProfile(data as SupabaseProfileRow)
  await AsyncStorage.setItem(getUserProfileKey(userId), JSON.stringify(profile))
  return profile
}

export async function saveUserProfile(
  profile: UserProfile,
  userId?: string,
): Promise<void> {
  if (userId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        avatar_emoji: profile.avatarEmoji,
        daily_goal: profile.dailyGoal,
        notifications_enabled: profile.notificationsEnabled,
        sounds_enabled: profile.soundsEnabled,
      })
      .eq('id', userId)
      .select('id')
      .maybeSingle()

    if (error) {
      throw new Error(`Could not save profile to Supabase: ${error.message}`)
    }
    if (!data) {
      throw new Error('No Supabase profile exists for the signed-in user.')
    }
  }

  await AsyncStorage.setItem(
    getUserProfileKey(userId),
    JSON.stringify(profile),
  )
}

export async function resetUserProfile(): Promise<UserProfile> {
  await AsyncStorage.removeItem(USER_PROFILE_KEY)
  return defaultUserProfile
}

