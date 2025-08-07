/**
 * Type definitions for @brutal/validation
 */

export type ValidatorFn<T = any> = (value: T, data?: any) => boolean | string | Promise<boolean | string>;

export interface ValidatorOptions {
  required?: boolean;
  message?: string;
  async?: ValidatorFn;
  custom?: ValidatorFn;
}

export interface StringOptions extends ValidatorOptions {
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  email?: boolean;
  url?: boolean;
}

export interface NumberOptions extends ValidatorOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;
}

export interface ArrayOptions extends ValidatorOptions {
  min?: number;
  max?: number;
  unique?: boolean;
}

export interface ObjectOptions extends ValidatorOptions {
  strict?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
  data?: any;
}

export interface Schema {
  [key: string]: Validator | Schema;
}

export interface Validator {
  type: string;
  options?: any;
  schema?: Schema | Validator;
  validate: ValidatorFn;
}

export type SchemaDefinition = Record<string, Validator | SchemaDefinition>;