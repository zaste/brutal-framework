# @brutal/cache API Reference

## Table of Contents

- [Classes](#classes)
- [Interfaces](#interfaces)
- [Functions](#functions)
- [Constants](#constants)

## Classes

### `ExampleFeature`

Main feature implementation.

#### Constructor

```typescript
new ExampleFeature(options?: ExampleOptions)
```

##### Parameters

- `options` (optional): Configuration options
  - `debug`: Enable debug logging (default: `false`)
  - `maxRetries`: Maximum retry attempts (default: `3`)

#### Methods

##### `execute()`

Execute the feature with given input.

```typescript
execute(input: string): Promise<ExampleResult>
```

###### Parameters

- `input`: The input string to process

###### Returns

Promise resolving to:
- `success`: Whether operation succeeded
- `data`: Result data (if successful)
- `error`: Error instance (if failed)

###### Example

```typescript
const result = await feature.execute('test');
if (result.success) {
  console.log(result.data); // "Processed: test"
}
```

## Interfaces

### `ExampleOptions`

Configuration options for ExampleFeature.

```typescript
interface ExampleOptions {
  debug?: boolean;
  maxRetries?: number;
}
```

### `ExampleResult`

Result of feature execution.

```typescript
interface ExampleResult {
  success: boolean;
  data?: unknown;
  error?: Error;
}
```

## Functions

### `validateOptions()`

Validates feature options.

```typescript
function validateOptions(options: Required<ExampleOptions>): void
```

Throws if options are invalid.

## Constants

### `VERSION`

Package version string.

```typescript
const VERSION: string = '__VERSION__';
```

### `DEFAULT_CONFIG`

Default configuration values.

```typescript
const DEFAULT_CONFIG = {
  debug: false,
  maxRetries: 3
} as const;
```

### `PACKAGE_NAME`

Package name constant.

```typescript
const PACKAGE_NAME = '@brutal/cache';
```
