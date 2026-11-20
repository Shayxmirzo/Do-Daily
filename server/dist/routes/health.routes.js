export const healthRoutes = async (fastify) => {
    const getHealth = () => ({
        status: 'ok',
        service: 'do-daily-backend',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
    });
    fastify.get('/health', async () => getHealth());
    fastify.get('/', async () => getHealth());
    fastify.head('/', async () => getHealth());
};
