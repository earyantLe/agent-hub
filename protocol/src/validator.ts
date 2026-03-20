import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import skillSchema from './skill-schema.json' with { type: 'json' };

export interface SkillDescriptor {
  name: string;
  version: string;
  description: string;
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  capabilities: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }>;
  auth?:
    | { type: 'none' }
    | { type: 'apiKey'; in: 'header' | 'query'; name: string }
    | { type: 'oauth2'; authorizationUrl: string; tokenUrl: string; scopes?: Record<string, string> };
  endpoints?: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    capability?: string;
  }>;
  metadata?: {
    tags?: string[];
    website?: string;
    repository?: string;
    license?: string;
  };
  [key: string]: unknown;
}

const ajv = new Ajv({ allErrors: true });
// @ts-expect-error - ajv-formats is a plugin that can be called with ajv instance
addFormats(ajv);

let validate: ValidateFunction;

export function getValidator() {
  if (!validate) {
    validate = ajv.compile(skillSchema);
  }
  return validate;
}

export interface ValidationError {
  instancePath: string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateSkillDescriptor(descriptor: unknown): ValidationResult {
  const validator = getValidator();
  const valid = validator(descriptor);

  if (valid) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: (validator.errors || []).map((err: { instancePath: string; message?: string }) => ({
      instancePath: err.instancePath,
      message: err.message
    }))
  };
}
