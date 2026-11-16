import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).default(''),
  category: z.enum(['health', 'study', 'personal']).default('study'),
  start_at: z.string().datetime({ message: 'start_at must be an ISO timestamp' }),
  end_at: z.string().datetime({ message: 'end_at must be an ISO timestamp' }),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['health', 'study', 'personal']).optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
})

const taskQuerySchema = z.object({
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  category: z.enum(['health', 'study', 'personal']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const tasksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth)

  // GET /api/tasks
  fastify.get('/api/tasks', async (request, reply) => {
    const userId = request.user!.id
    const parsedQuery = taskQuerySchema.safeParse(request.query)

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('start_at', { ascending: true })

    if (parsedQuery.success) {
      const { status, category, startDate, endDate } = parsedQuery.data
      if (status) query = query.eq('status', status)
      if (category) query = query.eq('category', category)
      if (startDate) query = query.gte('start_at', startDate)
      if (endDate) query = query.lte('end_at', endDate)
    }

    const { data: tasks, error } = await query

    if (error) {
      request.log.error(error, 'Error fetching tasks')
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not fetch tasks',
      })
    }

    return tasks ?? []
  })

  // POST /api/tasks
  fastify.post('/api/tasks', async (request, reply) => {
    const userId = request.user!.id
    const parsed = createTaskSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed for new task',
        details: parsed.error.format(),
      })
    }

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        user_id: userId,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        start_at: parsed.data.start_at,
        end_at: parsed.data.end_at,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      request.log.error(error, 'Error creating task')
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not create task',
      })
    }

    return reply.status(201).send(task)
  })

  // PUT /api/tasks/:id
  fastify.put<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
    const userId = request.user!.id
    const taskId = request.params.id
    const parsed = updateTaskSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid task update payload',
        details: parsed.error.format(),
      })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('tasks')
      .update(parsed.data)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !updated) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Task not found or not owned by user',
      })
    }

    // Award XP if task was completed
    if (parsed.data.status === 'completed') {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('xp')
          .eq('id', userId)
          .single()

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({ xp: (profile.xp || 0) + 35 })
            .eq('id', userId)
        }
      } catch (err) {
        request.log.warn({ err }, 'Could not award XP for completed task')
      }
    }

    return updated
  })

  // DELETE /api/tasks/:id
  fastify.delete<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
    const userId = request.user!.id
    const taskId = request.params.id

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not delete task',
      })
    }

    return { success: true, message: `Task ${taskId} deleted` }
  })

  // POST /api/tasks/clear-completed
  fastify.post('/api/tasks/clear-completed', async (request, reply) => {
    const userId = request.user!.id

    const { error, count } = await supabaseAdmin
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (error) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not clear completed tasks',
      })
    }

    return { success: true, deletedCount: count ?? 0 }
  })
}

