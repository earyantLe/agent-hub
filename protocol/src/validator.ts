import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import skillSchema from './skill-schema.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

let validate: ReturnType<typeof ajv.compile>;

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
    errors: (validator.errors || []).map(err => ({
      instancePath: err.instancePath,
      message: err.message
    }))
  };
}

export type { skillSchema as SkillSchema };
