import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .default(process.env.NODE_ENV === 'test' ? ':memory:' : './data/dev.sqlite'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      console.error(error.issues);
      throw new Error('Invalid configuration');
    }
    throw error;
  }
}

export const config = loadConfig();
