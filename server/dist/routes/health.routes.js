export const healthRoutes = async (fastify) => {
    fastify.get('/health', async () => {
        return {
            status: 'ok',
            service: 'do-daily-backend',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
        };
    });
};
