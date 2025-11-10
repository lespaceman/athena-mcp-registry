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

### Metrics (Prometheus)

```bash
GET /_api/metrics
```

**Note**: This is currently a placeholder endpoint. In production, integrate `prom-client` for real metrics.

## Configuration

Configuration is validated using Zod and loaded from environment variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | `3000` | Server port |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Environment |
| `DATABASE_URL` | string | `./data/dev.sqlite` | SQLite database path |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` | `info` | Logging level |
| `SENTRY_DSN` | string | - | Sentry DSN for error tracking (optional) |

Example `.env` file:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/dev.sqlite
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
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

## Observability

### Logging

The application uses **Pino** for structured logging:

- **Development**: Pretty-printed, colorized logs
- **Production**: Structured JSON logs for easy parsing and aggregation

**Log Levels**: `fatal`, `error`, `warn`, `info`, `debug`, `trace`

Configure via the `LOG_LEVEL` environment variable.

### Error Tracking

**Sentry Integration** (optional):

To enable error tracking, set the `SENTRY_DSN` environment variable:

```bash
export SENTRY_DSN=https://your-key@sentry.io/your-project
```

Sentry will automatically capture and report:
- Unhandled exceptions
- Application errors
- Performance metrics (trace sampling rate: 10% in production)

### Monitoring

- **Health Check**: `GET /_api/health` - Database connectivity and uptime
- **Metrics**: `GET /_api/metrics` - Placeholder for Prometheus metrics

## CI/CD

### Continuous Integration

The CI pipeline runs on every push and PR:

- Security audit (`pnpm audit`)
- Linting (`eslint`)
- Type checking (`tsc`)
- Unit tests (`vitest`)
- Build verification

**Workflow**: `.github/workflows/ci.yml`

### Continuous Deployment

On merge to `main`, the CD pipeline:

1. Runs full test suite
2. Builds multi-stage Docker image
3. Runs smoke tests (health + metrics endpoints)
4. Pushes to GitHub Container Registry (GHCR)

**Workflow**: `.github/workflows/cd.yml`

**Image Repository**: `ghcr.io/lespaceman/athena-mcp-registry`

**Image Tags**:
- `latest` - Latest main branch build
- `<sha>` - Specific commit SHA
- `<version>` - Semantic version (when tagged)

See [RELEASE.md](RELEASE.md) for detailed release and deployment procedures.

## Security

### Automated Security

- **Dependabot**: Automatically creates PRs for dependency updates
- **npm audit**: Runs on every CI build
- **GitHub Container Registry**: Secure, private image storage

### Security Checklist

Before deploying to production, ensure:

- [ ] All dependencies are up to date (`pnpm update`)
- [ ] No critical vulnerabilities (`pnpm audit`)
- [ ] Secrets are stored in environment variables (never in code)
- [ ] `NODE_ENV=production` is set in production
- [ ] Database file has appropriate permissions
- [ ] Sentry DSN is configured for error tracking
- [ ] Health check endpoint is monitored
- [ ] HTTPS is enabled (via reverse proxy)
- [ ] Rate limiting is configured (if needed)
- [ ] Input validation is in place for all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS is properly configured (if serving APIs to browsers)
- [ ] Security headers are set (via reverse proxy or Fastify plugin)
- [ ] Container runs as non-root user (already configured in Dockerfile)
- [ ] Sensitive logs are redacted (review pino configuration)

### Reporting Security Issues

If you discover a security vulnerability, please email [security contact] or open a private security advisory on GitHub.

**Do not** open public issues for security vulnerabilities.

## Docker

### Build and Run

```bash
# Build the image
docker build -t athena-mcp-registry .

# Run in production mode
docker run -d \
  --name athena-mcp-registry \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  athena-mcp-registry

# Check logs
docker logs -f athena-mcp-registry

# Health check
curl http://localhost:3000/_api/health
```

### Docker Compose

Use the provided `docker-compose.dev.yml` for local development:

```bash
docker-compose -f docker-compose.dev.yml up
```

For production deployment, see [RELEASE.md](RELEASE.md).

## Development Phases

### Phase 1: Foundation ✅

- ✅ Working `createApp()` + `server.ts`
- ✅ Health endpoint (`GET /_api/health`)
- ✅ SQLite database setup
- ✅ Initial migration
- ✅ Package scripts (dev, build, start, test, lint, typecheck)
- ✅ TypeScript configuration
- ✅ ESLint + Prettier
- ✅ Basic health endpoint test
- ✅ README with quick start

### Phase 2: Hardening ✅

- ✅ Migration system with up/down support
- ✅ Comprehensive test coverage
- ✅ Pre-commit hooks (Husky)
- ✅ Docker development environment
- ✅ CI pipeline (GitHub Actions)

### Phase 3: CI/CD & Observability ✅

- ✅ CD pipeline with Docker build and push
- ✅ Smoke tests in CI/CD
- ✅ Structured logging (Pino)
- ✅ Error tracking setup (Sentry)
- ✅ Health check and metrics endpoints
- ✅ Dependabot configuration
- ✅ Security audit in CI
- ✅ Release documentation
- ✅ Security checklist

## License

ISC
