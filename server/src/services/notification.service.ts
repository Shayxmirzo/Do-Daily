import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk'
import { env } from '../config/env.js'

export const expoClient = new Expo({
  accessToken: env.EXPO_ACCESS_TOKEN,
})

export async function sendTaskReminder(
  pushToken: string,
  title: string,
  body: string,
  taskId?: string,
): Promise<ExpoPushTicket[] | null> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`[PushNotification] Invalid Expo push token: ${pushToken}`)
    return null
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: taskId ? { taskId } : undefined,
    priority: 'high',
  }

  try {
    const chunks = expoClient.chunkPushNotifications([message])
    const tickets: ExpoPushTicket[] = []

    for (const chunk of chunks) {
      const ticketChunk = await expoClient.sendPushNotificationsAsync(chunk)
      tickets.push(...ticketChunk)
    }

    return tickets
  } catch (error) {
    console.error('[PushNotification] Error sending push notification:', error)
    return null
  }
}

