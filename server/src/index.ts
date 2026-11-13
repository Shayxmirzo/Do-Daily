import cors from '@fastify/cors'
import Fastify from 'fastify'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.routes.js'
import { profileRoutes } from './routes/profile.routes.js'
import { statsRoutes } from './routes/stats.routes.js'
import { tasksRoutes } from './routes/tasks.routes.js'
import { initCronJobs } from './services/cron.service.js'

async function bootstrap() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  })

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Register route handlers
  await fastify.register(healthRoutes)
  await fastify.register(profileRoutes)
  await fastify.register(tasksRoutes)
  await fastify.register(statsRoutes)

  // Initialize background workers (Reminders & Midnight tasks)
  initCronJobs()

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}. Shutting down gracefully...`)
      await fastify.close()
      process.exit(0)
    })
  }

  // Start Fastify HTTP server
  try {
    const address = await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    })
    fastify.log.info(`🚀 Do-Daily Fastify Server running at ${address}`)
    fastify.log.info(`🩺 Health check available at: ${address}/health`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

bootstrap()

