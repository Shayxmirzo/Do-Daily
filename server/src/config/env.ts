import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.string().default('10000').transform((val) => parseInt(val, 10)),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' }),
  EXPO_ACCESS_TOKEN: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.format())
  // In development, provide fallback defaults if not set yet so the app compiles
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Running in development with mock/empty credentials until .env is configured.')
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      PORT: parseInt(process.env.PORT || '10000', 10),
      HOST: process.env.HOST || '0.0.0.0',
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production') || 'development',
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key',
      EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN,
    }

