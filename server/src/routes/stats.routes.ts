import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import type { TaskCategory, TaskRecord } from '../types/index.js'

export const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth)

  fastify.get('/api/stats/summary', async (request, reply) => {
    const userId = request.user!.id
    const now = new Date()

    const { data: rawTasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      request.log.error(error, 'Error fetching user tasks for statistics')
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not calculate statistics',
      })
    }

    const tasks: TaskRecord[] = rawTasks ?? []
    const totalCount = tasks.length
    const completedCount = tasks.filter((t) => t.status === 'completed').length
    const pendingCount = tasks.filter(
      (t) => t.status === 'pending' && new Date(t.end_at).getTime() >= now.getTime(),
    ).length
    const overdueCount = tasks.filter(
      (t) => t.status === 'pending' && new Date(t.end_at).getTime() < now.getTime(),
    ).length

    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // Category breakdown
    const categories: TaskCategory[] = ['health', 'study', 'personal']
    const categoryStats = categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat)
      const catCompleted = catTasks.filter((t) => t.status === 'completed').length
      const percent = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      return {
        category: cat,
        total: catTasks.length,
        completed: catCompleted,
        percent,
      }
    })

    // Last 7 days activity chart
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekChart = []

    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfToday - i * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      const dateObj = new Date(dayStart)

      const dayTasks = tasks.filter((t) => {
        const time = new Date(t.start_at).getTime()
        return time >= dayStart && time < dayEnd
      })

      const completed = dayTasks.filter((t) => t.status === 'completed').length

      weekChart.push({
        dayName: dayNames[dateObj.getDay()],
        dayNumber: dateObj.getDate(),
        date: dateObj.toISOString().split('T')[0],
        total: dayTasks.length,
        completed,
        isToday: i === 0,
      })
    }

    return {
      totalCount,
      completedCount,
      pendingCount,
      overdueCount,
      completionRate,
      categoryStats,
      weekChart,
    }
  })
}

