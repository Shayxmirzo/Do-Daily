import { Expo } from 'expo-server-sdk';
import { env } from '../config/env.js';
export const expoClient = new Expo({
    accessToken: env.EXPO_ACCESS_TOKEN,
});
export async function sendTaskReminder(pushToken, title, body, taskId) {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`[PushNotification] Invalid Expo push token: ${pushToken}`);
        return null;
    }
    const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: taskId ? { taskId } : undefined,
        priority: 'high',
    };
    try {
        const chunks = expoClient.chunkPushNotifications([message]);
        const tickets = [];
        for (const chunk of chunks) {
            const ticketChunk = await expoClient.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        return tickets;
    }
    catch (error) {
        console.error('[PushNotification] Error sending push notification:', error);
        return null;
    }
}
