#!/usr/bin/env node
/**
 * Seed sample data for testing the lookup API
 */

import { getDatabase } from '../infra/db.js';
import { randomUUID } from 'crypto';

const db = getDatabase();

// Create sample author
const authorId = randomUUID();
db.prepare(
  `
  INSERT INTO authors (author_id, name, url, verified)
  VALUES (?, ?, ?, ?)
`,
).run(authorId, 'GitHub Inc', 'https://github.com', 1);

// Create GitHub MCP Server
const githubServerId = randomUUID();
db.prepare(
  `
  INSERT INTO servers (
    server_id, name, description, version, author_id,
    repository_type, repository_url,
    deployment_type, trust_level,
    categories, tags,
    popularity_score, install_count,
    last_updated
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  githubServerId,
  'GitHub MCP Server',
  'Access GitHub repositories, issues, pull requests, and more through MCP.',
  '1.0.0',
  authorId,
  'github',
  'https://github.com/modelcontextprotocol/servers',
  'local',
  'verified',
  JSON.stringify(['code-hosting', 'version-control']),
  JSON.stringify(['github', 'git', 'source-control']),
  95,
  15000,
  new Date().toISOString(),
);

// Add domain mapping for github.com (exact match)
const githubMappingId = randomUUID();
db.prepare(
  `
  INSERT INTO domain_mappings (
    mapping_id, server_id, domain_pattern, match_type, priority,
    auto_suggest, auto_install
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`,
).run(githubMappingId, githubServerId, 'github.com', 'exact', 1, 1, 0);

// Add configuration for GitHub server
const githubConfigId = randomUUID();
db.prepare(
  `
  INSERT INTO configurations (
    config_id, server_id,
    runtime, transport,
    installation_type, installation_package,
    is_default, priority
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  githubConfigId,
  githubServerId,
  'nodejs',
  'stdio',
  'npm',
  '@modelcontextprotocol/server-github',
  1,
  0,
);

// Add authentication for GitHub
const githubAuthId = randomUUID();
db.prepare(
  `
  INSERT INTO authentication_configs (
    auth_id, server_id,
    auth_type, priority, is_default, required, recommended,
    display_name, description,
    config_data
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  githubAuthId,
  githubServerId,
  'api_key',
  1,
  1,
  1,
  1,
  'GitHub Personal Access Token',
  'Required to access GitHub API',
  JSON.stringify({
    method: 'bearer',
    token_location: 'env_variable',
    env_variable_name: 'GITHUB_TOKEN',
  }),
);

// Add some tools for GitHub server
const toolIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];

const tools = [
  {
    id: toolIds[0],
    name: 'create_or_update_file',
    display_name: 'Create or Update File',
    description: 'Create or update a single file in a GitHub repository',
  },
  {
    id: toolIds[1],
    name: 'push_files',
    display_name: 'Push Files',
    description: 'Push multiple files to a GitHub repository in a single commit',
  },
  {
    id: toolIds[2],
    name: 'create_issue',
    display_name: 'Create Issue',
    description: 'Create a new issue in a GitHub repository',
  },
  {
    id: toolIds[3],
    name: 'create_pull_request',
    display_name: 'Create Pull Request',
    description: 'Create a new pull request in a GitHub repository',
  },
  {
    id: toolIds[4],
    name: 'search_repositories',
    display_name: 'Search Repositories',
    description: 'Search for GitHub repositories',
  },
];

for (const tool of tools) {
  db.prepare(
    `
    INSERT INTO tools (
      tool_id, server_id,
      tool_name, display_name, description,
      input_schema, requires_auth
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    tool.id,
    githubServerId,
    tool.name,
    tool.display_name,
    tool.description,
    JSON.stringify({}),
    1,
  );
}

// Create a wildcard domain server for *.atlassian.net
const jiraServerId = randomUUID();
db.prepare(
  `
  INSERT INTO servers (
    server_id, name, description, version, author_id,
    deployment_type, trust_level,
    categories, tags,
    popularity_score, install_count,
    last_updated
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  jiraServerId,
  'Jira MCP Server',
  'Access Jira issues, projects, and workflows through MCP.',
  '0.9.0',
  null,
  'remote',
  'community',
  JSON.stringify(['project-management', 'issue-tracking']),
  JSON.stringify(['jira', 'atlassian', 'agile']),
  75,
  5000,
  new Date().toISOString(),
);

// Add wildcard domain mapping for *.atlassian.net
const jiraMappingId = randomUUID();
db.prepare(
  `
  INSERT INTO domain_mappings (
    mapping_id, server_id, domain_pattern, match_type, priority,
    auto_suggest, auto_install
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`,
).run(jiraMappingId, jiraServerId, '*.atlassian.net', 'wildcard', 2, 1, 0);

// Add configuration for Jira server
const jiraConfigId = randomUUID();
db.prepare(
  `
  INSERT INTO configurations (
    config_id, server_id,
    transport, connection_base_url,
    is_default, priority
  ) VALUES (?, ?, ?, ?, ?, ?)
`,
).run(jiraConfigId, jiraServerId, 'http', 'https://api.jira-mcp.com', 1, 0);

// Add authentication for Jira
const jiraAuthId = randomUUID();
db.prepare(
  `
  INSERT INTO authentication_configs (
    auth_id, server_id,
    auth_type, priority, is_default, required, recommended,
    display_name, description,
    config_data
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
).run(
  jiraAuthId,
  jiraServerId,
  'oauth2',
  1,
  1,
  1,
  1,
  'Atlassian OAuth',
  'OAuth 2.0 authentication with Atlassian',
  JSON.stringify({
    flow_type: 'authorization_code',
    provider: 'atlassian',
  }),
);

// Add a couple of tools for Jira
db.prepare(
  `
  INSERT INTO tools (
    tool_id, server_id,
    tool_name, display_name, description,
    input_schema, requires_auth
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`,
).run(
  randomUUID(),
  jiraServerId,
  'get_issue',
  'Get Issue',
  'Get details of a Jira issue',
  JSON.stringify({}),
  1,
);

db.prepare(
  `
  INSERT INTO tools (
    tool_id, server_id,
    tool_name, display_name, description,
    input_schema, requires_auth
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`,
).run(
  randomUUID(),
  jiraServerId,
  'create_issue',
  'Create Issue',
  'Create a new Jira issue',
  JSON.stringify({}),
  1,
);

console.log('Sample data seeded successfully!');
console.log(`- GitHub MCP Server (github.com exact match)`);
console.log(`- Jira MCP Server (*.atlassian.net wildcard match)`);
