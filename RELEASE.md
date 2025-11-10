# Release Process

This document outlines the release process for Athena MCP Registry.

## Overview

The project uses automated CI/CD pipelines to build, test, and deploy the application. Releases are triggered when code is merged to the `main` branch.

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality in a backwards-compatible manner
- **PATCH**: Backwards-compatible bug fixes

## Automated Release Process

### 1. Continuous Integration (CI)

On every push to `main`, `develop`, or PR branches, the CI pipeline runs:

```bash
# Checks performed:
- Security audit (pnpm audit)
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Vitest)
- Build verification
```

**CI Workflow**: `.github/workflows/ci.yml`

### 2. Continuous Deployment (CD)

When code is merged to `main`, the CD pipeline automatically:

1. **Runs full test suite**
2. **Builds the application**
3. **Creates Docker image** with multi-stage build
4. **Runs smoke tests** against the built image
5. **Pushes to GitHub Container Registry** (ghcr.io)

**CD Workflow**: `.github/workflows/cd.yml`

### Image Tagging Strategy

Images are tagged with:
- `latest` - Always points to the latest main branch build
- `<sha>` - Specific commit SHA (e.g., `abc1234`)
- `<version>` - Semantic version (when tagged, e.g., `v1.2.3`)

**Example**:
```bash
ghcr.io/lespaceman/athena-mcp-registry:latest
ghcr.io/lespaceman/athena-mcp-registry:abc1234
ghcr.io/lespaceman/athena-mcp-registry:v1.0.0
```

## Manual Release Steps

### Creating a New Release

1. **Update version in package.json**:
   ```bash
   # For a patch release
   npm version patch

   # For a minor release
   npm version minor

   # For a major release
   npm version major
   ```

2. **Create a release branch**:
   ```bash
   git checkout -b release/v1.2.3
   ```

3. **Update CHANGELOG.md** with release notes:
   - New features
   - Bug fixes
   - Breaking changes
   - Migration notes (if any)

4. **Commit changes**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release v1.2.3"
   ```

5. **Create a pull request** to `main`

6. **After PR is merged**, create a Git tag:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   ```

7. **Create GitHub Release**:
   - Go to GitHub Releases
   - Click "Draft a new release"
   - Select the tag you just created
   - Add release notes from CHANGELOG.md
   - Publish release

### Smoke Testing

The CD pipeline automatically runs smoke tests, but you can also run them manually:

```bash
# Build the Docker image
docker build -t athena-mcp-registry:test .

# Run the container
docker run -d --name test-container -p 4000:3000 athena-mcp-registry:test

# Test health endpoint
curl http://localhost:4000/_api/health

# Test metrics endpoint
curl http://localhost:4000/_api/metrics

# Clean up
docker stop test-container
docker rm test-container
```

## Deployment

### Pulling the Latest Image

```bash
docker pull ghcr.io/lespaceman/athena-mcp-registry:latest
```

### Running in Production

```bash
docker run -d \
  --name athena-mcp-registry \
  -p 3000:3000 \
  -v /path/to/data:/app/data \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e DATABASE_URL=/app/data/production.sqlite \
  -e SENTRY_DSN=your-sentry-dsn-here \
  ghcr.io/lespaceman/athena-mcp-registry:latest
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  app:
    image: ghcr.io/lespaceman/athena-mcp-registry:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - DATABASE_URL=/app/data/production.sqlite
      - SENTRY_DSN=${SENTRY_DSN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/_api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Emergency Rollback

If a release causes issues in production, follow these steps:

### 1. Quick Rollback (Docker)

**Option A: Rollback to previous SHA**:
```bash
# Find the previous working SHA in GitHub Actions history
# Pull the specific image
docker pull ghcr.io/lespaceman/athena-mcp-registry:<previous-sha>

# Stop current container
docker stop athena-mcp-registry
docker rm athena-mcp-registry

# Start with previous image
docker run -d \
  --name athena-mcp-registry \
  -p 3000:3000 \
  -v /path/to/data:/app/data \
  -e NODE_ENV=production \
  ghcr.io/lespaceman/athena-mcp-registry:<previous-sha>
```

**Option B: Rollback to previous tag**:
```bash
# If you have tagged releases
docker pull ghcr.io/lespaceman/athena-mcp-registry:v1.2.2
docker stop athena-mcp-registry
docker rm athena-mcp-registry
docker run -d --name athena-mcp-registry ... ghcr.io/lespaceman/athena-mcp-registry:v1.2.2
```

### 2. Code Rollback

If the issue requires a code fix:

```bash
# Create a hotfix branch from the last good tag
git checkout -b hotfix/issue-description v1.2.2

# Make necessary fixes
git add .
git commit -m "fix: describe the fix"

# Push and create PR to main
git push origin hotfix/issue-description
```

### 3. Database Rollback

If database migrations were applied:

```bash
# Backup current database
docker exec athena-mcp-registry sqlite3 /app/data/production.sqlite ".backup /app/data/backup-$(date +%s).sqlite"

# Run down migrations if available
# (Migration rollback functionality to be implemented in future phases)
```

## Pre-Release Checklist

Before merging to `main`:

- [ ] All tests pass locally (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] No type errors (`pnpm typecheck`)
- [ ] Security audit passes (`pnpm audit`)
- [ ] CHANGELOG.md is updated
- [ ] Version number is bumped in package.json
- [ ] Documentation is updated (if needed)
- [ ] Breaking changes are clearly documented
- [ ] Migration steps are documented (if any)

## Post-Release Checklist

After a release is deployed:

- [ ] Verify CD pipeline completed successfully
- [ ] Smoke tests passed in GitHub Actions
- [ ] Check health endpoint in production
- [ ] Monitor Sentry for errors (if configured)
- [ ] Monitor application logs
- [ ] Update GitHub Release notes
- [ ] Announce release (if significant)

## Monitoring

### Health Check

```bash
curl https://your-domain.com/_api/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "db": "ok"
}
```

### Metrics

```bash
curl https://your-domain.com/_api/metrics
```

### Logs

```bash
# Docker logs
docker logs -f athena-mcp-registry

# With timestamp
docker logs -f --timestamps athena-mcp-registry

# Last 100 lines
docker logs --tail 100 athena-mcp-registry
```

## Troubleshooting

### Build Fails in CI

1. Check GitHub Actions logs for specific errors
2. Verify dependencies are correctly specified in package.json
3. Ensure all required environment variables are set
4. Run the build locally to reproduce: `pnpm install && pnpm build`

### Smoke Tests Fail

1. Check if the health endpoint is responding
2. Verify the Docker image was built correctly
3. Check container logs: `docker logs <container-name>`
4. Ensure database migrations ran successfully

### Container Won't Start

1. Check environment variables are correctly set
2. Verify volume mounts are correct
3. Check for port conflicts
4. Review container logs for startup errors

## Security

### Vulnerability Management

- Dependabot automatically creates PRs for security updates
- Security audits run on every CI build
- Review and merge security updates promptly
- For critical vulnerabilities, create an emergency hotfix

### Secret Management

**Never commit secrets to the repository!**

- Use environment variables for secrets
- Use GitHub Secrets for CI/CD workflows
- Rotate secrets regularly
- Use least-privilege access for all credentials

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation
- Review GitHub Actions logs for deployment issues
