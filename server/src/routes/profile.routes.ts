import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(300).optional(),
  avatar_emoji: z.string().max(10).optional(),
  daily_goal: z.number().int().min(1).max(50).optional(),
  notifications_enabled: z.boolean().optional(),
  sounds_enabled: z.boolean().optional(),
})

const pushTokenSchema = z.object({
  expo_push_token: z.string().min(5),
})

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication check to all profile routes
  fastify.addHook('preHandler', requireAuth)

  // GET /api/profile
  fastify.get('/api/profile', async (request, reply) => {
    const userId = request.user!.id

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Profile not found for this user',
      })
    }

    return profile
  })

  // PUT /api/profile
  fastify.put('/api/profile', async (request, reply) => {
    const userId = request.user!.id
    const parsed = updateProfileSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile data',
        details: parsed.error.format(),
      })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update(parsed.data)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      request.log.error(error, 'Error updating profile')
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not update profile',
      })
    }

    return updated
  })

  // POST /api/profile/push-token
  fastify.post('/api/profile/push-token', async (request, reply) => {
    const userId = request.user!.id
    const parsed = pushTokenSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid push token format',
      })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ expo_push_token: parsed.data.expo_push_token })
      .eq('id', userId)

    if (error) {
      request.log.error(error, 'Error saving push token')
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not save push token',
      })
    }

    return { success: true, message: 'Push token registered successfully' }
  })
}

