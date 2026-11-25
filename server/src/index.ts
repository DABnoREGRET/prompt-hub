import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDb } from './db/client.js';
import { runMigrations } from './db/migrate.js';

async function bootstrap() {
  if (env.AUTO_MIGRATE) {
    await runMigrations();
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Prompt Hub API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(async (err) => {
  console.error('Failed to start Prompt Hub API:', err);
  await closeDb();
  process.exit(1);
});
