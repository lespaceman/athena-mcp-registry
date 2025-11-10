# Athena MCP Registry

A clean, type-safe MCP (Model Context Protocol) registry built with Fastify, TypeScript, and SQLite.

## Architecture

This project follows Clean Architecture principles:

- **Routes/Controllers**: Handle HTTP requests and responses
- **Use Cases/Services**: Business logic layer
- **Adapters/Infrastructure**: External dependencies (database, etc.)

### Key Design Decisions

- **App Factory Pattern**: Uses `createApp()` for easy testing with Fastify's `inject()` method
- **No ORM**: Direct SQLite access via `better-sqlite3` for simplicity and performance
- **Strict TypeScript**: Full type safety with strict mode enabled
- **Zod Validation**: Runtime configuration validation
- **ESLint + Prettier**: Consistent code style

## Quick Start

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

The server will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

### Available Scripts

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Compile TypeScript to JavaScript
pnpm start        # Run production build
pnpm test         # Run tests with Vitest
pnpm test:ui      # Run tests with Vitest UI
pnpm typecheck    # Type check without emitting files
pnpm lint         # Lint code with ESLint
pnpm format       # Format code with Prettier
```

## Project Structure

```
athena-mcp-registry/
├── src/
│   ├── app.ts                 # App factory (createApp)
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   └── index.ts           # Zod-based config validation
│   ├── infra/
│   │   └── db.ts              # SQLite database adapter
│   ├── routes/
│   │   └── health.ts          # Health check endpoint
│   └── tests/
│       └── health.test.ts     # Health endpoint tests
├── migrations/
│   └── 001_init.sql           # Initial database schema
├── data/                      # SQLite database (gitignored)
├── dist/                      # Compiled output (gitignored)
└── package.json
```

## API Endpoints

### Health Check

```bash
GET /_api/health
```

**Response:**

```json
{
  "status": "ok",
  "uptime": 123.456,
  "db": "ok"
}
```

## Configuration

Configuration is validated using Zod and loaded from environment variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | `3000` | Server port |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Environment |
| `DB_PATH` | string | `./data/dev.sqlite` | SQLite database path |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` | `info` | Logging level |

Example `.env` file:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/dev.sqlite
LOG_LEVEL=info
```

## Database

The project uses SQLite with `better-sqlite3` for simplicity and performance. The database is created automatically on first run.

### Running Migrations

Currently, migrations are manual. Apply migrations using:

```bash
sqlite3 data/dev.sqlite < migrations/001_init.sql
```

A migration runner will be added in Phase 2.

## Testing

Tests use Vitest and Fastify's `inject()` method for in-memory testing without starting a server:

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test -- --coverage
```

## Development

### Adding a New Route

1. Create a route file in `src/routes/`
2. Register it in `src/app.ts`
3. Add tests in `src/tests/`

Example:

```typescript
// src/routes/example.ts
import { FastifyPluginAsync } from 'fastify';

const plugin: FastifyPluginAsync = async (server) => {
  server.get('/example', async () => {
    return { message: 'Hello World' };
  });
};

export default plugin;
```

```typescript
// Register in src/app.ts
import exampleRoutes from './routes/example.js';
app.register(exampleRoutes, { prefix: '/_api' });
```

## Phase 1 Status

- ✅ Working `createApp()` + `server.ts`
- ✅ Health endpoint (`GET /_api/health`)
- ✅ SQLite database setup
- ✅ Initial migration
- ✅ Package scripts (dev, build, start, test, lint, typecheck)
- ✅ TypeScript configuration
- ✅ ESLint + Prettier
- ✅ Basic health endpoint test
- ✅ README with quick start

## License

ISC
