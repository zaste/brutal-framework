# @brutal/validation

Ultra-lightweight validation library for BRUTAL V5 with schema builder and async support.

## Features

- 🎯 **Tiny Bundle**: Only 3.42KB (minified + gzipped)
- 🏗️ **Schema Builder**: Intuitive API for complex validations
- ⚡ **Async Support**: Built-in async validation
- 🔧 **Extensible**: Custom validators and messages
- 🌳 **Tree-shakeable**: Import only what you need
- 📦 **Zero Dependencies**: Pure JavaScript implementation
- 🔍 **TypeScript**: Full type support

## Installation

```bash
npm install @brutal/validation
# or
pnpm add @brutal/validation
# or
yarn add @brutal/validation
```

## Usage

### Basic Validation

```typescript
import { string, number, boolean, validate } from '@brutal/validation';

// String validation
const nameValidator = string({ required: true, min: 3, max: 20 });
const result = await validate(nameValidator, 'John');
console.log(result.valid); // true

// Number validation
const ageValidator = number({ min: 18, max: 120, integer: true });
const ageResult = await validate(ageValidator, 25);
console.log(ageResult.valid); // true

// Boolean validation
const activeValidator = boolean({ required: true });
const activeResult = await validate(activeValidator, true);
console.log(activeResult.valid); // true
```

### Schema Validation

```typescript
import { schema, string, number, array, object, validate } from '@brutal/validation';

const userSchema = schema({
  username: string({ required: true, min: 3, max: 20 }),
  email: string({ email: true, required: true }),
  age: number({ min: 18, max: 120 }),
  roles: array(string({ enum: ['admin', 'user', 'guest'] })),
  profile: object({
    firstName: string({ required: true }),
    lastName: string({ required: true }),
    bio: string({ max: 500 })
  })
});

const userData = {
  username: 'johndoe',
  email: 'john@example.com',
  age: 30,
  roles: ['user', 'admin'],
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Software developer'
  }
};

const result = await validate(userSchema, userData);
if (result.valid) {
  console.log('Valid user data:', result.data);
} else {
  console.log('Validation errors:', result.errors);
}
```

### String Validators

```typescript
// Basic string validation
string({ required: true });

// Length validation
string({ min: 3, max: 20 });

// Pattern matching
string({ pattern: /^[A-Z][a-z]+$/ });

// Email validation
string({ email: true });

// Enum validation
string({ enum: ['red', 'green', 'blue'] });

// Custom error messages
string({ 
  required: true, 
  min: 3,
  message: 'Username must be at least 3 characters' 
});
```

### Number Validators

```typescript
// Basic number validation
number({ required: true });

// Range validation
number({ min: 0, max: 100 });

// Integer validation
number({ integer: true });

// Positive/negative shortcuts
number({ positive: true }); // min: 0
number({ negative: true }); // max: 0
```

### Array Validators

```typescript
// Basic array validation
array();

// Array with typed items
array(string({ min: 2 }));

// Array length validation
array(number(), { min: 1, max: 10 });

// Unique items
array(string(), { unique: true });
```

### Object Validators

```typescript
// Basic object validation
object();

// Object with schema
object({
  street: string({ required: true }),
  city: string({ required: true }),
  zipCode: string({ pattern: /^\d{5}$/ })
});

// Strict mode (no extra properties)
object({
  name: string()
}, { strict: true });
```

### Custom Validators

```typescript
// Synchronous custom validation
const passwordValidator = string({
  min: 8,
  custom: (value) => {
    if (!/[A-Z]/.test(value)) return 'Must contain uppercase letter';
    if (!/[0-9]/.test(value)) return 'Must contain number';
    return true; // Return 1 for optimized version
  }
});

// Context-aware validation
const confirmPasswordSchema = schema({
  password: string({ min: 8 }),
  confirmPassword: string({
    custom: (value, data) => 
      value === data?.password ? 1 : 'Passwords must match'
  })
});
```

### Async Validation

```typescript
// Async custom validator
const usernameValidator = string({
  required: true,
  min: 3,
  async: async (value) => {
    // Check if username exists (API call)
    const exists = await checkUsernameExists(value);
    return !exists ? 1 : 'Username already taken';
  }
});

// Use with await
const result = await validate(usernameValidator, 'newuser');
```

### Nested Validation

```typescript
const addressSchema = object({
  street: string({ required: true }),
  city: string({ required: true }),
  country: string({ required: true })
});

const companySchema = schema({
  name: string({ required: true }),
  addresses: array(addressSchema, { min: 1 }),
  headquarters: addressSchema
});

const companyData = {
  name: 'Tech Corp',
  addresses: [
    { street: '123 Main St', city: 'NYC', country: 'USA' }
  ],
  headquarters: { street: '456 HQ Blvd', city: 'SF', country: 'USA' }
};

const result = await validate(companySchema, companyData);
```

## API Reference

### Validators

- `string(options?)` / `str(options?)` - String validator
- `number(options?)` / `num(options?)` - Number validator
- `boolean(options?)` / `bool(options?)` - Boolean validator
- `array(itemValidator?, options?)` / `arr(itemValidator?, options?)` - Array validator
- `object(schema?, options?)` / `obj(schema?, options?)` - Object validator

### Schema Builder

- `schema(definition)` - Creates a validation schema from an object definition

### Validation

- `validate(validator, data)` - Validates data against a validator or schema

### Common Options

All validators support these base options:
- `required?: boolean` - Makes the field required
- `message?: string` - Custom error message
- `custom?: (value, data) => boolean | string | Promise<...>` - Custom validation
- `async?: (value, data) => Promise<boolean | string>` - Async validation

### Return Values

The `validate` function returns a Promise that resolves to:
```typescript
{
  valid: boolean;
  errors?: Record<string, string>; // Field errors when invalid
  data?: any; // Validated data when valid
}
```

## Real-World Examples

### User Registration

```typescript
const registrationSchema = schema({
  username: string({ 
    required: true, 
    min: 3, 
    max: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    async: async (value) => {
      const available = await checkUsernameAvailable(value);
      return available ? 1 : 'Username taken';
    }
  }),
  email: string({ 
    required: true, 
    email: true 
  }),
  password: string({ 
    required: true, 
    min: 8,
    custom: (value) => {
      if (!/[A-Z]/.test(value)) return 'Need uppercase';
      if (!/[0-9]/.test(value)) return 'Need number';
      return 1;
    }
  }),
  confirmPassword: string({
    required: true,
    custom: (value, data) => 
      value === data?.password ? 1 : 'Passwords must match'
  }),
  terms: boolean({
    required: true,
    custom: (value) => value ? 1 : 'Must accept terms'
  })
});
```

### API Request Validation

```typescript
const apiRequestSchema = schema({
  method: string({ 
    required: true, 
    enum: ['GET', 'POST', 'PUT', 'DELETE'] 
  }),
  endpoint: string({ 
    required: true,
    pattern: /^\/api\/[a-z]+$/
  }),
  headers: object({
    'Content-Type': string({ required: true }),
    'Authorization': string({ pattern: /^Bearer .+$/ })
  }),
  body: object({}, { required: false })
});
```

### Form Validation

```typescript
const productFormSchema = schema({
  name: string({ required: true }),
  price: number({ required: true, min: 0 }),
  category: string({ 
    required: true,
    enum: ['electronics', 'clothing', 'food', 'other']
  }),
  tags: array(string({ min: 1 }), { max: 5 }),
  description: string({ max: 1000 }),
  specifications: object({
    weight: number({ min: 0 }),
    dimensions: object({
      width: number({ min: 0 }),
      height: number({ min: 0 }),
      depth: number({ min: 0 })
    })
  })
});
```

## Performance

@brutal/validation is optimized for size and performance:

- **Bundle Size**: 3.42KB minified + gzipped
- **Tree-shaking**: Import only the validators you need
- **Minimal overhead**: Direct validation without intermediate objects
- **Async-first**: All validators are async by default but optimized for sync operations

## Tips

1. **Return 1 for success** in custom validators (optimized for minification)
2. **Use shortcuts**: `str`, `num`, `bool`, `arr`, `obj` for smaller bundles
3. **Compose validators**: Build complex validations from simple ones
4. **Leverage context**: Access parent data in custom validators
5. **Handle async properly**: Always await validate() calls

## Browser Support

- Chrome/Edge 42+
- Firefox 39+
- Safari 10.1+
- iOS Safari 10.3+
- Node.js 14+

## License

MIT