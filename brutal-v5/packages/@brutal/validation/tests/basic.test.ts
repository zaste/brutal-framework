import { describe, it, expect } from '@jest/globals';
import { string, number, boolean, array, object, schema, validate } from '../src/index';

describe('@brutal/validation - Basic Tests', () => {
  describe('String validation', () => {
    it('validates strings', async () => {
      const v = string();
      expect((await validate(v, 'test')).valid).toBe(true);
      expect((await validate(v, 123)).valid).toBe(false);
    });

    it('validates required', async () => {
      const v = string({ required: true });
      expect((await validate(v, 'test')).valid).toBe(true);
      expect((await validate(v, '')).valid).toBe(false);
      expect((await validate(v, null)).valid).toBe(false);
    });

    it('validates min/max length', async () => {
      const v = string({ min: 3, max: 5 });
      expect((await validate(v, 'abc')).valid).toBe(true);
      expect((await validate(v, 'abcde')).valid).toBe(true);
      expect((await validate(v, 'ab')).valid).toBe(false);
      expect((await validate(v, 'abcdef')).valid).toBe(false);
    });

    it('validates patterns', async () => {
      const v = string({ pattern: /^[A-Z]+$/ });
      expect((await validate(v, 'ABC')).valid).toBe(true);
      expect((await validate(v, 'abc')).valid).toBe(false);
    });

    it('validates email', async () => {
      const v = string({ email: true });
      expect((await validate(v, 'test@example.com')).valid).toBe(true);
      expect((await validate(v, 'invalid')).valid).toBe(false);
    });
  });

  describe('Number validation', () => {
    it('validates numbers', async () => {
      const v = number();
      expect((await validate(v, 123)).valid).toBe(true);
      expect((await validate(v, 'abc')).valid).toBe(false);
      expect((await validate(v, NaN)).valid).toBe(false);
    });

    it('validates min/max', async () => {
      const v = number({ min: 0, max: 100 });
      expect((await validate(v, 50)).valid).toBe(true);
      expect((await validate(v, -1)).valid).toBe(false);
      expect((await validate(v, 101)).valid).toBe(false);
    });

    it('validates integers', async () => {
      const v = number({ integer: true });
      expect((await validate(v, 42)).valid).toBe(true);
      expect((await validate(v, 42.5)).valid).toBe(false);
    });
  });

  describe('Boolean validation', () => {
    it('validates booleans', async () => {
      const v = boolean();
      expect((await validate(v, true)).valid).toBe(true);
      expect((await validate(v, false)).valid).toBe(true);
      expect((await validate(v, 'true')).valid).toBe(false);
      expect((await validate(v, 1)).valid).toBe(false);
    });
  });

  describe('Array validation', () => {
    it('validates arrays', async () => {
      const v = array();
      expect((await validate(v, [])).valid).toBe(true);
      expect((await validate(v, [1, 2, 3])).valid).toBe(true);
      expect((await validate(v, 'not array')).valid).toBe(false);
    });

    it('validates array length', async () => {
      const v = array(undefined, { min: 2, max: 4 });
      expect((await validate(v, [1, 2])).valid).toBe(true);
      expect((await validate(v, [1])).valid).toBe(false);
      expect((await validate(v, [1, 2, 3, 4, 5])).valid).toBe(false);
    });

    it('validates array items', async () => {
      const v = array(string());
      expect((await validate(v, ['a', 'b'])).valid).toBe(true);
      expect((await validate(v, ['a', 123])).valid).toBe(false);
    });
  });

  describe('Object validation', () => {
    it('validates objects', async () => {
      const v = object();
      expect((await validate(v, {})).valid).toBe(true);
      expect((await validate(v, { a: 1 })).valid).toBe(true);
      expect((await validate(v, [])).valid).toBe(false);
      expect((await validate(v, 'not object')).valid).toBe(false);
    });

    it('validates nested schemas', async () => {
      const v = object({
        name: string({ required: true }),
        age: number({ min: 0 })
      });
      
      expect((await validate(v, { name: 'John', age: 30 })).valid).toBe(true);
      expect((await validate(v, { name: '', age: 30 })).valid).toBe(false);
      expect((await validate(v, { name: 'John', age: -1 })).valid).toBe(false);
    });
  });

  describe('Schema validation', () => {
    it('validates complete schemas', async () => {
      const userSchema = schema({
        username: string({ required: true, min: 3 }),
        email: string({ email: true }),
        age: number({ min: 18 }),
        roles: array(string())
      });

      const validUser = {
        username: 'john',
        email: 'john@example.com',
        age: 25,
        roles: ['user']
      };

      const result = await validate(userSchema, validUser);
      expect(result.valid).toBe(true);
    });

    it('validates with custom validators', async () => {
      const passwordSchema = schema({
        password: string({ min: 8 }),
        confirmPassword: string({
          custom: (value, data) => value === data?.password ? 1 : 'Passwords must match'
        })
      });

      expect((await validate(passwordSchema, {
        password: '12345678',
        confirmPassword: '12345678'
      })).valid).toBe(true);

      expect((await validate(passwordSchema, {
        password: '12345678',
        confirmPassword: 'different'
      })).valid).toBe(false);
    });
  });
});