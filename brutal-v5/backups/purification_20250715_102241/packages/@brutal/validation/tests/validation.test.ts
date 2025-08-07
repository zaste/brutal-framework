import { describe, it, expect } from '@jest/globals';
import { string, number, boolean, array, object, schema, validate } from '../src/index';

describe('@brutal/validation', () => {
  describe('String validation', () => {
    it('should validate required strings', async () => {
      const validator = string({ required: true });
      
      expect((await validate(validator, 'test')).valid).toBe(true);
      expect((await validate(validator, '')).valid).toBe(false);
      expect((await validate(validator, null)).valid).toBe(false);
      expect((await validate(validator, undefined)).valid).toBe(false);
    });

    it('should validate string length', async () => {
      const validator = string({ min: 3, max: 10 });
      
      expect(await validate(validator, 'test')).toEqual({ valid: true, data: 'test' });
      expect(await validate(validator, 'a')).toEqual({ valid: false, errors: { '': 'Min 3 chars' } });
      expect(await validate(validator, 'this is too long')).toEqual({ valid: false, errors: { '': 'Max 10 chars' } });
    });

    it('should validate patterns', async () => {
      const validator = string({ pattern: /^[A-Z]+$/ });
      
      expect(await validate(validator, 'ABC')).toEqual({ valid: true, data: 'ABC' });
      expect(await validate(validator, 'abc')).toEqual({ valid: false, errors: { '': 'Invalid format' } });
    });

    it('should validate email', async () => {
      const validator = string({ email: true });
      
      expect(await validate(validator, 'test@example.com')).toEqual({ valid: true, data: 'test@example.com' });
      expect(await validate(validator, 'invalid-email')).toEqual({ valid: false, errors: { '': 'Invalid format' } });
    });

    it('should validate enum values', async () => {
      const validator = string({ enum: ['red', 'green', 'blue'] });
      
      expect(await validate(validator, 'red')).toEqual({ valid: true, data: 'red' });
      expect(await validate(validator, 'yellow')).toEqual({ valid: false, errors: { '': 'Invalid value' } });
    });

    it('should support custom validators', async () => {
      const validator = string({
        custom: (value) => value === 'secret' || 'Must be secret'
      });
      
      expect(await validate(validator, 'secret')).toEqual({ valid: true, data: 'secret' });
      expect(await validate(validator, 'public')).toEqual({ valid: false, errors: { '': 'Must be secret' } });
    });

    it('should support async validators', async () => {
      const validator = string({
        async: async (value) => {
          await new Promise(r => setTimeout(r, 10));
          return value === 'async' || 'Must be async';
        }
      });
      
      expect(await validate(validator, 'async')).toEqual({ valid: true, data: 'async' });
      expect(await validate(validator, 'sync')).toEqual({ valid: false, errors: { '': 'Must be async' } });
    });
  });

  describe('Number validation', () => {
    it('should validate required numbers', async () => {
      const validator = number({ required: true });
      
      expect(await validate(validator, 42)).toEqual({ valid: true, data: 42 });
      expect(await validate(validator, null)).toEqual({ valid: false, errors: { '': 'Required' } });
      expect(await validate(validator, undefined)).toEqual({ valid: false, errors: { '': 'Required' } });
    });

    it('should validate number range', async () => {
      const validator = number({ min: 0, max: 100 });
      
      expect(await validate(validator, 50)).toEqual({ valid: true, data: 50 });
      expect(await validate(validator, -1)).toEqual({ valid: false, errors: { '': 'Min 0' } });
      expect(await validate(validator, 101)).toEqual({ valid: false, errors: { '': 'Max 100' } });
    });

    it('should validate integers', async () => {
      const validator = number({ integer: true });
      
      expect(await validate(validator, 42)).toEqual({ valid: true, data: 42 });
      expect(await validate(validator, 42.5)).toEqual({ valid: false, errors: { '': 'Must be integer' } });
    });

    it('should validate positive/negative', async () => {
      const positive = number({ positive: true });
      const negative = number({ negative: true });
      
      expect(await validate(positive, 1)).toEqual({ valid: true, data: 1 });
      expect(await validate(positive, -1)).toEqual({ valid: false, errors: { '': 'Min 0' } });
      
      expect(await validate(negative, -1)).toEqual({ valid: true, data: -1 });
      expect(await validate(negative, 1)).toEqual({ valid: false, errors: { '': 'Max 0' } });
    });

    it('should reject non-numbers', async () => {
      const validator = number();
      
      expect(await validate(validator, 'not a number')).toEqual({ valid: false, errors: { '': 'Must be number' } });
      expect(await validate(validator, {})).toEqual({ valid: false, errors: { '': 'Must be number' } });
    });
  });

  describe('Boolean validation', () => {
    it('should validate booleans', async () => {
      const validator = boolean();
      
      expect(await validate(validator, true)).toEqual({ valid: true, data: true });
      expect(await validate(validator, false)).toEqual({ valid: true, data: false });
      expect(await validate(validator, 'true')).toEqual({ valid: false, errors: { '': 'Must be boolean' } });
      expect(await validate(validator, 1)).toEqual({ valid: false, errors: { '': 'Must be boolean' } });
    });

    it('should validate required booleans', async () => {
      const validator = boolean({ required: true });
      
      expect(await validate(validator, false)).toEqual({ valid: true, data: false });
      expect(await validate(validator, null)).toEqual({ valid: false, errors: { '': 'Required' } });
    });
  });

  describe('Array validation', () => {
    it('should validate arrays', async () => {
      const validator = array();
      
      expect(await validate(validator, [])).toEqual({ valid: true, data: [] });
      expect(await validate(validator, [1, 2, 3])).toEqual({ valid: true, data: [1, 2, 3] });
      expect(await validate(validator, 'not array')).toEqual({ valid: false, errors: { '': 'Must be array' } });
    });

    it('should validate array length', async () => {
      const validator = array(undefined, { min: 2, max: 5 });
      
      expect(await validate(validator, [1, 2, 3])).toEqual({ valid: true, data: [1, 2, 3] });
      expect(await validate(validator, [1])).toEqual({ valid: false, errors: { '': 'Min 2 items' } });
      expect(await validate(validator, [1, 2, 3, 4, 5, 6])).toEqual({ valid: false, errors: { '': 'Max 5 items' } });
    });

    it('should validate array items', async () => {
      const validator = array(string({ min: 2 }));
      
      expect(await validate(validator, ['ab', 'cd'])).toEqual({ valid: true, data: ['ab', 'cd'] });
      expect(await validate(validator, ['ab', 'c'])).toEqual({ valid: false, errors: { '': '[1]: Min 2 chars' } });
    });

    it('should validate unique arrays', async () => {
      const validator = array(undefined, { unique: true });
      
      expect(await validate(validator, [1, 2, 3])).toEqual({ valid: true, data: [1, 2, 3] });
      expect(await validate(validator, [1, 2, 2, 3])).toEqual({ valid: false, errors: { '': 'Must be unique' } });
    });
  });

  describe('Object validation', () => {
    it('should validate objects', async () => {
      const validator = object();
      
      expect(await validate(validator, {})).toEqual({ valid: true, data: {} });
      expect(await validate(validator, { a: 1 })).toEqual({ valid: true, data: { a: 1 } });
      expect(await validate(validator, [])).toEqual({ valid: false, errors: { '': 'Must be object' } });
      expect(await validate(validator, 'not object')).toEqual({ valid: false, errors: { '': 'Must be object' } });
    });

    it('should validate nested schemas', async () => {
      const validator = object({
        name: string({ required: true }),
        age: number({ min: 0 })
      });
      
      expect(await validate(validator, { name: 'John', age: 30 })).toEqual({ 
        valid: true, 
        data: { name: 'John', age: 30 } 
      });
      
      const result = await validate(validator, { name: '', age: -1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name: Required');
      expect(result.errors).toContain('age: Min 0');
    });

    it('should validate strict mode', async () => {
      const validator = object({
        name: string()
      }, { strict: true });
      
      expect(await validate(validator, { name: 'John' })).toEqual({ 
        valid: true, 
        data: { name: 'John' } 
      });
      expect(await validate(validator, { name: 'John', extra: 'field' })).toEqual({ 
        valid: false, 
        errors: { '': 'Unknown keys: extra' } 
      });
    });
  });

  describe('Schema validation', () => {
    it('should validate complete schemas', async () => {
      const userSchema = schema({
        username: string({ required: true, min: 3, max: 20 }),
        email: string({ email: true, required: true }),
        age: number({ min: 18, max: 120 }),
        isActive: boolean(),
        roles: array(string({ enum: ['admin', 'user', 'guest'] })),
        profile: object({
          firstName: string({ required: true }),
          lastName: string({ required: true })
        })
      });

      const validUser = {
        username: 'johndoe',
        email: 'john@example.com',
        age: 30,
        isActive: true,
        roles: ['user', 'admin'],
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const result = await validate(userSchema, validUser);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validUser);
    });

    it('should collect all errors', async () => {
      const userSchema = schema({
        username: string({ required: true, min: 3 }),
        email: string({ email: true, required: true }),
        age: number({ min: 18 })
      });

      const invalidUser = {
        username: 'ab',
        email: 'invalid',
        age: 10
      };

      const result = await validate(userSchema, invalidUser);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({
        username: 'Min 3 chars',
        email: 'Invalid format',
        age: 'Min 18'
      });
    });

    it('should handle optional fields', async () => {
      const schema1 = schema({
        required: string({ required: true }),
        optional: string()
      });

      expect(await validate(schema1, { required: 'test' })).toEqual({
        valid: true,
        data: { required: 'test' }
      });

      expect(await validate(schema1, { required: 'test', optional: 'value' })).toEqual({
        valid: true,
        data: { required: 'test', optional: 'value' }
      });
    });
  });

  describe('Custom messages', () => {
    it('should use custom error messages', async () => {
      const validator = string({ 
        required: true, 
        min: 3,
        message: 'Custom error message'
      });
      
      expect(await validate(validator, '')).toEqual({ 
        valid: false, 
        errors: { '': 'Custom error message' } 
      });
      expect(await validate(validator, 'ab')).toEqual({ 
        valid: false, 
        errors: { '': 'Custom error message' } 
      });
    });
  });

  describe('Complex validations', () => {
    it('should validate with context', async () => {
      const passwordSchema = schema({
        password: string({ min: 8, required: true }),
        confirmPassword: string({
          required: true,
          custom: (value, data) => value === data?.password || 'Passwords must match'
        })
      });

      expect(await validate(passwordSchema, {
        password: 'password123',
        confirmPassword: 'password123'
      })).toEqual({
        valid: true,
        data: { password: 'password123', confirmPassword: 'password123' }
      });

      expect(await validate(passwordSchema, {
        password: 'password123',
        confirmPassword: 'different'
      })).toEqual({
        valid: false,
        errors: { confirmPassword: 'Passwords must match' }
      });
    });

    it('should handle deeply nested objects', async () => {
      const addressSchema = object({
        street: string({ required: true }),
        city: string({ required: true }),
        country: string({ required: true })
      });

      const companySchema = schema({
        name: string({ required: true }),
        addresses: array(addressSchema),
        headquarters: addressSchema
      });

      const validCompany = {
        name: 'Tech Corp',
        addresses: [
          { street: '123 Main St', city: 'NYC', country: 'USA' },
          { street: '456 Oak Ave', city: 'LA', country: 'USA' }
        ],
        headquarters: { street: '789 HQ Blvd', city: 'SF', country: 'USA' }
      };

      expect(await validate(companySchema, validCompany)).toEqual({
        valid: true,
        data: validCompany
      });
    });
  });
});