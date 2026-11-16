import type { FastifyRequest } from 'fastify'

export type TaskCategory = 'health' | 'study' | 'personal'
export type TaskStatus = 'pending' | 'completed' | 'failed'

export interface UserPayload {
  id: string
  email?: string
}

export interface TaskRecord {
  id: string
  user_id: string
  title: string
  description: string
  category: TaskCategory
  status: TaskStatus
  start_at: string
  end_at: string
  created_at: string
  updated_at: string
}

export interface ProfileRecord {
  id: string
  name: string
  email: string | null
  bio: string
  avatar_emoji: string
  daily_goal: number
  notifications_enabled: boolean
  sounds_enabled: boolean
  expo_push_token: string | null
  xp: number
  streak: number
  created_at: string
  updated_at: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload
  }
}

