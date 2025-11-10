# Athena MCP Registry

A clean, type-safe MCP (Model Context Protocol) registry that helps discover and configure MCP servers based on domain context. Built with Fastify, TypeScript, and SQLite.

## What is MCP Lookup?

The **MCP Lookup API** enables intelligent discovery of MCP servers based on domain context. When users visit a website or work with a specific service, the lookup endpoint automatically suggests relevant MCP servers that can enhance their experience.

**Example Use Cases:**

- **Browsing github.com** → Suggests GitHub MCP Server with tools to manage repos, issues, and PRs
- **Working on yourcompany.atlassian.net** → Suggests Jira MCP Server with project management tools
- **Reading API documentation** → Suggests relevant MCP servers for that API

## Quick Start for API Consumers

### Base URL

```
http://localhost:3000  # Local development
https://your-domain.com  # Production
```

### Basic Lookup Request

```bash
# Find MCP servers for a domain
curl "http://localhost:3000/api/v1/lookup?domain=github.com"
```

### Example Response

```json
{
  "domain": "github.com",
  "match_metadata": {
    "match_count": 1,
    "search_time_ms": 12,
    "cache_hit": false
  },
  "matches": [
    {
      "server_id": "abc-123",
      "name": "GitHub MCP Server",
      "description": "Access GitHub repositories, issues, pull requests, and more through MCP.",
      "version": "1.0.0",
      "deployment_type": "local",
      "match_type": "exact",
      "match_confidence": 100,
      "installation_complexity": "simple",
      "estimated_setup_minutes": 5,
      "requires_restart": false,
      "auth_required": true,
      "auth_type": "api_key",
      "oauth_ready": false,
      "auth_methods": ["api_key"],
      "configurations": [
        {
          "config_id": "cfg-123",
          "runtime": "nodejs",
          "transport": "stdio",
          "quick_install": true
        }
      ],
      "tools_count": 5,
      "top_tools": [
        "Create or Update File",
        "Push Files",
        "Create Issue",
        "Create Pull Request",
        "Search Repositories"
      ],
      "resources_available": false,
      "trust_level": "verified",
      "popularity_score": 95,
      "install_count": 15000,
      "last_updated": "2025-01-10T12:00:00Z"
    }
  ]
}
```

## API Reference

### MCP Lookup Endpoint

**`GET /api/v1/lookup`**

Look up MCP servers for a given domain with intelligent matching and filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain` | string | **required** | Domain to lookup (e.g., "github.com", "api.example.com") |
| `trust_levels` | string | `"verified,community"` | Comma-separated trust levels: `verified`, `community`, `unverified` |
| `deployment_types` | string | `"local,remote,hybrid"` | Comma-separated deployment types |
| `max_results` | integer | `10` | Maximum number of results (1-50) |
| `include_categories` | boolean | `false` | Include category-based matches |

#### Request Examples

```bash
# Basic lookup
curl "http://localhost:3000/api/v1/lookup?domain=github.com"

# Only verified servers
curl "http://localhost:3000/api/v1/lookup?domain=github.com&trust_levels=verified"

# Only local deployments
curl "http://localhost:3000/api/v1/lookup?domain=slack.com&deployment_types=local"

# Limit results
curl "http://localhost:3000/api/v1/lookup?domain=example.com&max_results=5"

# Multiple filters
curl "http://localhost:3000/api/v1/lookup?domain=github.com&trust_levels=verified,community&deployment_types=local&max_results=3"
```

#### Response Structure

**Success Response (200 OK)**

```json
{
  "domain": "string",
  "match_metadata": {
    "match_count": 0,
    "search_time_ms": 0,
    "cache_hit": false
  },
  "matches": [
    {
      "server_id": "string",
      "name": "string",
      "description": "string",
      "version": "string",
      "deployment_type": "local|remote|hybrid",
      "match_type": "exact|wildcard|category",
      "match_confidence": 0,
      "priority": 0,
      "auto_suggest": false,
      "installation_complexity": "simple|moderate|complex",
      "estimated_setup_minutes": 0,
      "requires_restart": false,
      "prerequisites_summary": "string (optional)",
      "auth_required": false,
      "auth_type": "string (optional)",
      "oauth_ready": false,
      "auth_methods": ["string"],
      "configurations": [
        {
          "config_id": "string",
          "runtime": "string (optional)",
          "transport": "string",
          "quick_install": false
        }
      ],
      "tools_count": 0,
      "top_tools": ["string"],
      "resources_available": false,
      "trust_level": "verified|community|unverified",
      "popularity_score": 0,
      "install_count": 0,
      "last_updated": "string (optional)"
    }
  ]
}
```

**No Matches Found (404 Not Found)**

```json
{
  "error": "no_matches",
  "message": "No MCP servers found for this domain",
  "domain": "example.com",
  "suggestions": {
    "similar_domains": [],
    "category_matches": []
  }
}
```

**Validation Error (400 Bad Request)**

```json
{
  "error": "invalid_request",
  "message": "Invalid domain format",
  "details": {
    "param": "domain",
    "code": "invalid_string"
  }
}
```

#### Match Types

- **exact**: Domain exactly matches the pattern (e.g., `github.com`)
- **wildcard**: Domain matches a wildcard pattern (e.g., `*.atlassian.net` matches `yourcompany.atlassian.net`)
- **category**: Server matched based on domain category (when `include_categories=true`)

#### Trust Levels

- **verified**: Official or thoroughly vetted servers
- **community**: Community-maintained servers with good reputation
- **unverified**: New or unvetted servers

#### Deployment Types

- **local**: Runs on user's machine (typically Node.js/Python processes)
- **remote**: Hosted service accessed via HTTP/SSE
- **hybrid**: Can be deployed either way

#### Caching

- Responses are cached for **15 minutes**
- Cache key includes all query parameters
- `match_metadata.cache_hit` indicates if response was cached

### Health Check

**`GET /_api/health`**

Check server health and database connectivity.

```bash
curl http://localhost:3000/_api/health
```

**Response:**

```json
{
  "status": "ok",
  "uptime": 123.456,
  "db": "ok"
}
```

### Metrics

**`GET /_api/metrics`**

Prometheus-compatible metrics endpoint (placeholder in current version).

## Integration Examples

### JavaScript/TypeScript

```typescript
interface LookupResponse {
  domain: string;
  match_metadata: {
    match_count: number;
    search_time_ms: number;
    cache_hit: boolean;
  };
  matches: Array<{
    server_id: string;
    name: string;
    description: string;
    version: string;
    deployment_type: 'local' | 'remote' | 'hybrid';
    match_type: 'exact' | 'wildcard' | 'category';
    match_confidence: number;
    tools_count: number;
    top_tools: string[];
    auth_required: boolean;
    trust_level: 'verified' | 'community' | 'unverified';
    // ... other fields
  }>;
}

async function lookupMCPServers(domain: string): Promise<LookupResponse> {
  const params = new URLSearchParams({
    domain,
    trust_levels: 'verified,community',
    max_results: '10'
  });

  const response = await fetch(
    `http://localhost:3000/api/v1/lookup?${params}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return { domain, match_metadata: { match_count: 0, search_time_ms: 0, cache_hit: false }, matches: [] };
    }
    throw new Error(`Lookup failed: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const results = await lookupMCPServers('github.com');
console.log(`Found ${results.match_metadata.match_count} servers`);
results.matches.forEach(server => {
  console.log(`- ${server.name}: ${server.description}`);
  console.log(`  Tools: ${server.top_tools.join(', ')}`);
});
```

### Python

```python
import requests
from typing import Optional, List, Dict, Any

def lookup_mcp_servers(
    domain: str,
    trust_levels: str = "verified,community",
    max_results: int = 10
) -> Optional[Dict[str, Any]]:
    """Look up MCP servers for a given domain."""
    params = {
        "domain": domain,
        "trust_levels": trust_levels,
        "max_results": str(max_results)
    }

    response = requests.get(
        "http://localhost:3000/api/v1/lookup",
        params=params
    )

    if response.status_code == 404:
        return None

    response.raise_for_status()
    return response.json()

# Usage
result = lookup_mcp_servers("github.com")
if result:
    print(f"Found {result['match_metadata']['match_count']} servers")
    for server in result['matches']:
        print(f"- {server['name']}: {server['description']}")
        print(f"  Tools: {', '.join(server['top_tools'])}")
```

### Browser Extension Example

```javascript
// Automatically suggest MCP servers based on current tab URL
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = new URL(tab.url).hostname;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/lookup?domain=${domain}&trust_levels=verified`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.matches.length > 0) {
          // Show notification about available MCP servers
          const topMatch = data.matches[0];
          if (topMatch.auto_suggest) {
            showNotification({
              title: `MCP Server Available: ${topMatch.name}`,
              message: topMatch.description,
              actions: ['Install', 'Learn More']
            });
          }
        }
      }
    } catch (error) {
      console.error('MCP lookup failed:', error);
    }
  }
});
```

### Understanding Response Fields

| Field | Description | Example Use Case |
|-------|-------------|------------------|
| `match_confidence` | 0-100 score indicating match quality | Filter out low-confidence matches (<50) |
| `auto_suggest` | Whether to proactively suggest this server | Show notifications only for auto_suggest=true |
| `installation_complexity` | simple/moderate/complex | Warn users about complex installations |
| `estimated_setup_minutes` | Setup time estimate | Show time commitment to user |
| `auth_required` | Whether authentication is needed | Prepare OAuth flow or API key input |
| `oauth_ready` | OAuth is available | Prefer OAuth over API keys when available |
| `quick_install` | Can be installed via npm/pip | Enable one-click installation |
| `trust_level` | Server verification status | Filter by trust level for security |
| `tools_count` | Number of available tools | Display capability richness |

## Rate Limits & Performance

### Caching Behavior

- **Cache Duration**: 15 minutes
- **Cache Key**: Includes all query parameters (domain, trust_levels, deployment_types, max_results, include_categories)
- **Cache Indicator**: `match_metadata.cache_hit` field in response
- **Cache Cleanup**: Automatic cleanup runs every 5 minutes

**Example:**

```bash
# First request - cache miss
curl "http://localhost:3000/api/v1/lookup?domain=github.com"
# Response: "cache_hit": false, "search_time_ms": 45

# Second request within 15 minutes - cache hit
curl "http://localhost:3000/api/v1/lookup?domain=github.com"
# Response: "cache_hit": true, "search_time_ms": 2
```

### Performance Characteristics

- **Average Response Time**: 10-50ms (cold), 1-5ms (cached)
- **Database**: SQLite with prepared statements
- **Concurrency**: Handles concurrent requests efficiently via Fastify
- **Search Strategy**:
  1. Exact domain matches (fastest)
  2. Wildcard pattern matches (if needed)
  3. Category-based matches (if enabled)

### Best Practices

1. **Cache-Friendly Queries**: Use consistent parameter order and values
2. **Batch Lookups**: If looking up multiple domains, use separate requests (parallel) rather than sequential
3. **Filter Early**: Use `trust_levels` and `deployment_types` to reduce result set size
4. **Monitor Cache Hits**: Track `cache_hit` rate to optimize query patterns
5. **Respect Cache TTL**: Don't bypass cache unnecessarily - 15 minutes is optimal for discovery

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

---

## For Developers

### Architecture

This project follows Clean Architecture principles:

- **Routes/Controllers**: Handle HTTP requests and responses (`src/routes/`)
- **Use Cases/Services**: Business logic layer (`src/services/`)
- **Adapters/Infrastructure**: External dependencies - database, etc. (`src/infra/`)

### Key Design Decisions

- **App Factory Pattern**: Uses `createApp()` for easy testing with Fastify's `inject()` method
- **No ORM**: Direct SQLite access via `better-sqlite3` for simplicity and performance
- **Strict TypeScript**: Full type safety with strict mode enabled
- **Zod Validation**: Runtime configuration and request validation
- **ESLint + Prettier**: Consistent code style enforced via pre-commit hooks

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- pnpm 8+

### Development Setup

```bash
# Install dependencies
pnpm install

# Run migrations and start dev server
pnpm dev

# The server will start on http://localhost:3000
```

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
pnpm migrate:run  # Run database migrations
```

### Project Structure

```
athena-mcp-registry/
├── src/
│   ├── app.ts                   # App factory (createApp)
│   ├── server.ts                # Server entry point
│   ├── config/
│   │   └── index.ts             # Zod-based config validation
│   ├── infra/
│   │   ├── db.ts                # SQLite database adapter
│   │   └── migrations.ts        # Migration system
│   ├── routes/
│   │   ├── health.ts            # Health check endpoint
│   │   ├── lookup.ts            # MCP lookup endpoint ⭐
│   │   └── metrics.ts           # Metrics endpoint
│   ├── services/
│   │   └── lookup.service.ts    # Lookup business logic ⭐
│   ├── types/
│   │   ├── lookup.ts            # Lookup API types
│   │   ├── models.ts            # Database models
│   │   └── schemas.ts           # Validation schemas
│   ├── tests/
│   │   ├── health.test.ts
│   │   └── lookup.test.ts       # Lookup endpoint tests
│   └── scripts/
│       ├── migrate.ts           # Migration runner
│       └── seed-sample-data.ts  # Sample data seeder
├── migrations/
│   ├── 001_init.sql
│   ├── 002_core_entities.sql
│   ├── 003_configurations.sql
│   ├── 004_authentication.sql
│   ├── 005_domain_mappings.sql
│   ├── 006_capabilities.sql
│   ├── 007_remote_server_config.sql
│   └── 008_prerequisites.sql
├── data/                        # SQLite database (gitignored)
├── dist/                        # Compiled output (gitignored)
└── package.json
```

### Database

The project uses SQLite with `better-sqlite3` for simplicity and performance. The database is created automatically on first run.

**Running Migrations:**

```bash
# Run all pending migrations
pnpm migrate:run

# Check migration status
pnpm migrate:status
```

**Seeding Sample Data:**

```bash
tsx src/scripts/seed-sample-data.ts
```

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
