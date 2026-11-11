import AsyncStorage from '@react-native-async-storage/async-storage'

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

export const defaultUserProfile: UserProfile = {
  name: 'Алексей Смирнов',
  email: 'alex.daily@example.com',
  bio: 'Каждый день — шаг к поставленной цели 🎯',
  avatarEmoji: '⚡',
  dailyGoal: 5,
  notificationsEnabled: true,
  soundsEnabled: true,
}

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY)
    if (!raw) {
      return defaultUserProfile
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : defaultUserProfile.name,
      email: typeof parsed.email === 'string' ? parsed.email : defaultUserProfile.email,
      bio: typeof parsed.bio === 'string' ? parsed.bio : defaultUserProfile.bio,
      avatarEmoji: typeof parsed.avatarEmoji === 'string' ? parsed.avatarEmoji : defaultUserProfile.avatarEmoji,
      dailyGoal: typeof parsed.dailyGoal === 'number' && parsed.dailyGoal > 0 ? parsed.dailyGoal : defaultUserProfile.dailyGoal,
      notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : defaultUserProfile.notificationsEnabled,
      soundsEnabled: typeof parsed.soundsEnabled === 'boolean' ? parsed.soundsEnabled : defaultUserProfile.soundsEnabled,
    }
  } catch {
    return defaultUserProfile
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
}

export async function resetUserProfile(): Promise<UserProfile> {
  await AsyncStorage.removeItem(USER_PROFILE_KEY)
  return defaultUserProfile
}

