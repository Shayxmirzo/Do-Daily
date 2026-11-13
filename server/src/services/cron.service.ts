import cron from 'node-cron'
import { supabaseAdmin } from '../config/supabase.js'
import { sendTaskReminder } from './notification.service.js'

export function initCronJobs() {
  console.log('⏰ Initializing background cron jobs...')

  // 1. Task reminder check: runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date()
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)

      // Find upcoming pending tasks starting between now and 15 mins
      const { data: upcomingTasks, error } = await supabaseAdmin
        .from('tasks')
        .select(`
          id,
          title,
          start_at,
          user_id,
          profiles!inner (
            expo_push_token,
            notifications_enabled
          )
        `)
        .eq('status', 'pending')
        .gte('start_at', now.toISOString())
        .lte('start_at', in15Minutes.toISOString())

      if (error) {
        console.error('[Cron:Reminders] Error querying upcoming tasks:', error.message)
        return
      }

      if (!upcomingTasks || upcomingTasks.length === 0) {
        return
      }

      console.log(`[Cron:Reminders] Found ${upcomingTasks.length} upcoming task(s). Dispatching notifications...`)

      for (const item of upcomingTasks) {
        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
        if (profile?.notifications_enabled && profile?.expo_push_token) {
          await sendTaskReminder(
            profile.expo_push_token,
            'Напоминание о задаче ⏰',
            `Скоро начнется: "${item.title}"`,
            item.id,
          )
        }
      }
    } catch (err) {
      console.error('[Cron:Reminders] Unexpected error in reminder cron job:', err)
    }
  })

  // 2. Midnight cleanup & streak maintenance: runs every night at 00:01
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('[Cron:Midnight] Running midnight task maintenance...')
      const now = new Date()

      // Mark overdue pending tasks from past days as failed
      const { error: overdueError, count } = await supabaseAdmin
        .from('tasks')
        .update({ status: 'failed' })
        .eq('status', 'pending')
        .lt('end_at', now.toISOString())

      if (overdueError) {
        console.error('[Cron:Midnight] Error updating overdue tasks:', overdueError.message)
      } else {
        console.log(`[Cron:Midnight] Marked ${count ?? 0} overdue task(s) as failed.`)
      }
    } catch (err) {
      console.error('[Cron:Midnight] Unexpected error in midnight cron job:', err)
    }
  })

  console.log('✅ Cron jobs scheduled successfully.')
}

