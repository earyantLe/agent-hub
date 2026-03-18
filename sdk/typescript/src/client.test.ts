import { describe, it, expect } from 'vitest';
import { AgentHubClient } from '../src/client.js';

describe('AgentHubClient', () => {
  it('should create client with correct config', () => {
    const client = new AgentHubClient({
      registryUrl: 'http://localhost:3000'
    });
    expect(client).toBeDefined();
  });

  it('should create client with API key', () => {
    const client = new AgentHubClient({
      registryUrl: 'http://localhost:3000',
      apiKey: 'test-key-123'
    });
    expect(client).toBeDefined();
  });

  it('should handle trailing slash in registryUrl', () => {
    const client1 = new AgentHubClient({
      registryUrl: 'http://localhost:3000/'
    });
    const client2 = new AgentHubClient({
      registryUrl: 'http://localhost:3000'
    });
    expect(client1).toBeDefined();
    expect(client2).toBeDefined();
  });
});
