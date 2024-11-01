import { FastifyInstance } from 'fastify';
import server from './server';

// Global error handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

async function startServer(app: FastifyInstance) {
  try {
    const port = +app.config.API_PORT;
    const host = app.config.API_HOST;
    
    await app.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handlers
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    try {
      await server.close();
      console.log(`Server closed on ${signal}`);
      process.exit(0);
    } catch (err) {
      console.error(`Error during shutdown on ${signal}:`, err);
      process.exit(1);
    }
  });
});

// Start server
await startServer(server);
