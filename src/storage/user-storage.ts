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

const USER_PROFILE_KEY_PREFIX = 'user_profile'
const LEGACY_USER_PROFILE_KEY = 'user_profile'
const USER_PROFILE_MIGRATION_KEY = '@do-daily/user-profile-scope-migration-v1'

function getUserProfileKey(user?: User | null): string {
  return user?.id
    ? `${USER_PROFILE_KEY_PREFIX}:${user.id}`
    : `${USER_PROFILE_KEY_PREFIX}:guest`
}

let profileScopeMigration: Promise<void> | null = null

async function migrateLegacyUserProfile(): Promise<void> {
  const migrationComplete = await AsyncStorage.getItem(USER_PROFILE_MIGRATION_KEY)
  if (migrationComplete === 'true') return

  const legacyProfile = await AsyncStorage.getItem(LEGACY_USER_PROFILE_KEY)
  if (legacyProfile !== null) {
    const guestProfileKey = getUserProfileKey()
    const guestProfile = await AsyncStorage.getItem(guestProfileKey)
    if (guestProfile === null) {
      await AsyncStorage.setItem(guestProfileKey, legacyProfile)
    }
    await AsyncStorage.removeItem(LEGACY_USER_PROFILE_KEY)
  }

  await AsyncStorage.setItem(USER_PROFILE_MIGRATION_KEY, 'true')
}

async function ensureProfileScopeMigration(): Promise<void> {
  if (!profileScopeMigration) {
    profileScopeMigration = migrateLegacyUserProfile().catch((error: unknown) => {
      profileScopeMigration = null
      throw error
    })
  }
  await profileScopeMigration
}

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
  await ensureProfileScopeMigration()
  const userProfileKey = getUserProfileKey(user)
  let profile = { ...defaultUserProfile }

  // 1. Read local cache first
  const raw = await AsyncStorage.getItem(userProfileKey)
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
        await AsyncStorage.setItem(userProfileKey, JSON.stringify(profile))
      } else if (error) {
        console.warn(
          '[ProfileSync] Could not fetch profile; using its local cache:',
          error.message,
        )
      }
    } catch (error) {
      console.warn(
        '[ProfileSync] Could not fetch profile; using its local cache:',
        error instanceof Error ? error.message : 'Unexpected profile fetch error.',
      )
    }
  }

  return profile
}

export async function saveUserProfile(profile: UserProfile, user?: User | null): Promise<void> {
  // Save locally
  await ensureProfileScopeMigration()
  await AsyncStorage.setItem(getUserProfileKey(user), JSON.stringify(profile))

  // Sync to Supabase if logged in
  if (user?.id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          email: profile.email || user.email,
          bio: profile.bio,
          avatar_emoji: profile.avatarEmoji,
          daily_goal: profile.dailyGoal,
          notifications_enabled: profile.notificationsEnabled,
          sounds_enabled: profile.soundsEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle()
      if (error) {
        console.warn(
          '[ProfileSync] Cloud save failed; profile was saved locally:',
          error.message,
        )
      } else if (!data) {
        console.warn(
          '[ProfileSync] Cloud save skipped; no profile row exists for this account.',
        )
      }
    } catch (error) {
      console.warn(
        '[ProfileSync] Cloud save failed; profile was saved locally:',
        error instanceof Error ? error.message : 'Unexpected profile save error.',
      )
    }
  }
}

export async function resetUserProfile(user?: User | null): Promise<UserProfile> {
  await ensureProfileScopeMigration()
  await AsyncStorage.removeItem(getUserProfileKey(user))
  return { ...defaultUserProfile }
}

