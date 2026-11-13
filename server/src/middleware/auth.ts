import type { FastifyReply, FastifyRequest } from 'fastify'
import { supabaseAdmin } from '../config/supabase.js'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header with Bearer token',
    })
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token',
      })
    }

    request.user = {
      id: data.user.id,
      email: data.user.email,
    }
  } catch (err) {
    request.log.error(err, 'Failed to authenticate request with Supabase')
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Authentication verification service error',
    })
  }
}

