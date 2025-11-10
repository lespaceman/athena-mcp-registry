import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
