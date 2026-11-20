import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useAuth } from './auth-context'
import {
  defaultUserProfile,
  loadUserProfile,
  saveUserProfile,
  type UserProfile,
} from '../storage/user-storage'

type UserProfileContextValue = {
  profile: UserProfile
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<UserProfile>
  saveProfile: (profile: UserProfile) => Promise<void>
}

type ProfileState = {
  ownerId: string | null | undefined
  profile: UserProfile
  loading: boolean
  error: string | null
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected profile storage error occurred.'
}

export function UserProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const activeUserIdRef = useRef<string | null>(userId)
  const [state, setState] = useState<ProfileState>({
    ownerId: undefined,
    profile: { ...defaultUserProfile },
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true
    activeUserIdRef.current = userId

    loadUserProfile(user)
      .then((profile) => {
        if (active) {
          setState({ ownerId: userId, profile, loading: false, error: null })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            ownerId: userId,
            profile: { ...defaultUserProfile },
            loading: false,
            error: errorMessage(error),
          })
        }
      })

    return () => {
      active = false
    }
  }, [user, userId])

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await loadUserProfile(user)
      if (activeUserIdRef.current === userId) {
        setState({ ownerId: userId, profile, loading: false, error: null })
      }
      return profile
    } catch (error) {
      if (activeUserIdRef.current === userId) {
        setState({
          ownerId: userId,
          profile: { ...defaultUserProfile },
          loading: false,
          error: errorMessage(error),
        })
      }
      throw error
    }
  }, [user, userId])

  const saveProfile = useCallback(
    async (profile: UserProfile) => {
      await saveUserProfile(profile, user)
      if (activeUserIdRef.current === userId) {
        setState({ ownerId: userId, profile, loading: false, error: null })
      }
    },
    [user, userId],
  )

  const currentState = state.ownerId === userId ? state : null

  return (
    <UserProfileContext.Provider
      value={{
        profile: currentState?.profile ?? { ...defaultUserProfile },
        loading: currentState?.loading ?? true,
        error: currentState?.error ?? null,
        refreshProfile,
        saveProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile(): UserProfileContextValue {
  const context = useContext(UserProfileContext)
  if (context === null) {
    throw new Error('useUserProfile must be used within a UserProfileProvider.')
  }
  return context
}
