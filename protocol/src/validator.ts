import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import skillSchema from './skill-schema.json' with { type: 'json' };

const ajv = new Ajv({ allErrors: true });
// @ts-ignore - ajv-formats is a plugin that can be called with ajv instance
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
    errors: (validator.errors || []).map((err: any) => ({
      instancePath: err.instancePath,
      message: err.message
    }))
  };
}
