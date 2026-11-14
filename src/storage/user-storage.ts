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
  const raw = await AsyncStorage.getItem(USER_PROFILE_KEY)
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

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
}

export async function resetUserProfile(): Promise<UserProfile> {
  await AsyncStorage.removeItem(USER_PROFILE_KEY)
  return defaultUserProfile
}

