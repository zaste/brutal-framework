/**
 * @brutal/validation - Ultra-lightweight validation library
 * @packageDocumentation
 */

// Export minimal implementation with proper names
export { 
  s as string,
  str,
  n as number, 
  num,
  b as boolean,
  bool,
  a as array,
  arr,
  o as object,
  obj,
  schema,
  v as validate
} from './minimal';

// Type exports
export type {
  ValidatorFn,
  ValidatorOptions,
  StringOptions,
  NumberOptions,
  ArrayOptions,
  ObjectOptions,
  ValidationResult,
  Schema,
  Validator,
  SchemaDefinition
} from './types';

// Constants
export const VERSION = '__VERSION__';
export const PACKAGE_NAME = '@brutal/validation';