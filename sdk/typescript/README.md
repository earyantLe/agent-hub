# @agent-hub/sdk

TypeScript SDK for Agent Hub Registry.

## Installation

```bash
pnpm add @agent-hub/sdk
```

## Usage

```typescript
import { AgentHubClient } from '@agent-hub/sdk';

const client = new AgentHubClient({
  registryUrl: 'https://registry.agent-hub.dev',
  apiKey: 'your-api-key' // optional
});

// List skills
const skills = await client.listSkills();

// Search skills
const zhSkills = await client.listSkills('zhihu');

// Get skill details
const skill = await client.getSkill('zhihu-skill');

// Submit skill
const result = await client.submitSkill(skillDescriptor);
```
