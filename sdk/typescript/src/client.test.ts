import { describe, it, expect } from 'vitest';
import { AgentHubClient, AgentHubError } from '../src/client.js';

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

  it('should accept timeout option', () => {
    const client = new AgentHubClient({
      registryUrl: 'http://localhost:3000',
      timeout: 60000
    });
    expect(client).toBeDefined();
  });
});

describe('AgentHubError', () => {
  it('should create error with status', () => {
    const error = new AgentHubError('Not found', 404);
    expect(error.name).toBe('AgentHubError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('should create error with details', () => {
    const error = new AgentHubError('Validation failed', 400, [
      { instancePath: '/name', message: 'Required' }
    ]);
    expect(error.details).toHaveLength(1);
    expect(error.details?.[0].instancePath).toBe('/name');
  });

  it('should identify validation error', () => {
    const error = new AgentHubError('Invalid', 400);
    expect(error.isValidationError()).toBe(true);
    expect(error.isNotFound()).toBe(false);
  });

  it('should identify not found error', () => {
    const error = new AgentHubError('Not found', 404);
    expect(error.isNotFound()).toBe(true);
    expect(error.isValidationError()).toBe(false);
  });

  it('should identify conflict error', () => {
    const error = new AgentHubError('Conflict', 409);
    expect(error.isConflict()).toBe(true);
  });

  it('should identify rate limit error', () => {
    const error = new AgentHubError('Too many requests', 429);
    expect(error.isRateLimited()).toBe(true);
  });
});
