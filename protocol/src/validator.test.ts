import { describe, it, expect } from 'vitest';
import { validateSkillDescriptor } from '../src/validator.js';

describe('validateSkillDescriptor', () => {
  it('should accept a valid skill descriptor', () => {
    const validSkill = {
      name: 'test-skill',
      version: '1.0.0',
      description: 'A test skill',
      capabilities: [
        {
          name: 'test_capability',
          description: 'Test capability',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            }
          }
        }
      ],
      auth: { type: 'none' }
    };

    const result = validateSkillDescriptor(validSkill);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject a skill with missing required fields', () => {
    const invalidSkill = {
      name: 'test-skill'
      // Missing version, description, capabilities
    };

    const result = validateSkillDescriptor(invalidSkill);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject a skill with invalid name format', () => {
    const invalidSkill = {
      name: 'Invalid_Name_123', // Should be kebab-case
      version: '1.0.0',
      description: 'Test',
      capabilities: [
        {
          name: 'test',
          description: 'Test',
          inputSchema: { type: 'object' }
        }
      ],
      auth: { type: 'none' }
    };

    const result = validateSkillDescriptor(invalidSkill);
    expect(result.valid).toBe(false);
  });

  it('should accept a skill with oauth2 auth', () => {
    const skillWithOAuth = {
      name: 'oauth-skill',
      version: '1.0.0',
      description: 'OAuth protected skill',
      capabilities: [
        {
          name: 'protected_action',
          description: 'Protected action',
          inputSchema: { type: 'object' }
        }
      ],
      auth: {
        type: 'oauth2',
        authorizationUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        scopes: {
          read: 'Read access',
          write: 'Write access'
        }
      }
    };

    const result = validateSkillDescriptor(skillWithOAuth);
    expect(result.valid).toBe(true);
  });

  it('should accept a skill with apiKey auth', () => {
    const skillWithApiKey = {
      name: 'api-key-skill',
      version: '1.0.0',
      description: 'API Key protected skill',
      capabilities: [
        {
          name: 'secure_action',
          description: 'Secure action',
          inputSchema: { type: 'object' }
        }
      ],
      auth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    };

    const result = validateSkillDescriptor(skillWithApiKey);
    expect(result.valid).toBe(true);
  });
});
