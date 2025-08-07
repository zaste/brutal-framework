# @brutal/http

Ultra-lightweight HTTP client for BRUTAL V5 with interceptors, retries, and transformers.

## Features

- 🎯 **Tiny Bundle**: Only 3.9KB (minified + gzipped)
- 🔌 **Interceptors**: Request/response interceptors for auth, logging, etc.
- 🔄 **Retry Logic**: Configurable retry with exponential backoff
- ⏱️ **Timeouts**: Built-in request timeout support
- 🔧 **Transformers**: Transform request/response data
- 📦 **Zero Dependencies**: Pure JavaScript implementation
- 🌐 **Modern Fetch**: Built on native Fetch API

## Installation

```bash
npm install @brutal/http
# or
pnpm add @brutal/http
# or
yarn add @brutal/http
```

## Usage

### Basic Requests

```typescript
import { createHttp } from '@brutal/http';

const http = createHttp();

// GET request
const response = await http.get('https://api.example.com/users');
console.log(response.data);

// POST request
const newUser = await http.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
await http.put('https://api.example.com/users/1', {
  name: 'Jane Doe'
});

// DELETE request
await http.delete('https://api.example.com/users/1');
```

### Query Parameters

```typescript
// Automatically serializes query parameters
const response = await http.get('https://api.example.com/users', {
  params: {
    page: 1,
    limit: 10,
    tags: ['admin', 'active'] // Arrays are properly serialized
  }
});
// Results in: /users?page=1&limit=10&tags=admin&tags=active
```

### Request Configuration

```typescript
const response = await http.request({
  url: 'https://api.example.com/data',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value'
  },
  data: { key: 'value' },
  timeout: 5000, // 5 second timeout
  signal: abortController.signal // AbortController support
});
```

### Interceptors

```typescript
// Request interceptor
http.interceptors.request.use(
  (config) => {
    // Add auth token to all requests
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${getToken()}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    // Log all responses
    console.log(`${response.config.method} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

// Remove interceptor
const interceptorId = http.interceptors.request.use(/* ... */);
http.interceptors.request.eject(interceptorId);
```

### Retry Logic

```typescript
// Retry failed requests up to 3 times with exponential backoff
const response = await http.get('https://api.example.com/data', {
  retry: {
    count: 3,
    delay: 1000, // Start with 1 second delay
    shouldRetry: (error, attempt) => {
      // Only retry on network errors or 5xx responses
      return !error.response || error.response.status >= 500;
    }
  }
});
```

### Transformers

```typescript
// Transform request data
const response = await http.post('https://api.example.com/data', data, {
  transformRequest: [
    (data) => {
      // Add timestamp to all requests
      return { ...data, timestamp: Date.now() };
    },
    (data) => {
      // Convert to FormData if needed
      if (data.file) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });
        return formData;
      }
      return data;
    }
  ]
});

// Transform response data
const response = await http.get('https://api.example.com/data', {
  transformResponse: [
    (data) => {
      // Parse nested JSON strings
      if (data.nested && typeof data.nested === 'string') {
        data.nested = JSON.parse(data.nested);
      }
      return data;
    },
    (data) => {
      // Add computed properties
      return {
        ...data,
        fullName: `${data.firstName} ${data.lastName}`
      };
    }
  ]
});
```

### Error Handling

```typescript
try {
  const response = await http.get('https://api.example.com/data');
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Response error:', error.response.status);
    console.error('Response data:', error.response.data);
  } else if (error.request) {
    // Request was made but no response
    console.error('Network error:', error.message);
  } else {
    // Request configuration error
    console.error('Request error:', error.message);
  }
}
```

### Timeout Handling

```typescript
// Set a 3 second timeout
const response = await http.get('https://api.example.com/slow-endpoint', {
  timeout: 3000
});

// Use with AbortController for more control
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const response = await http.get('https://api.example.com/data', {
  signal: controller.signal
});
```

## API Reference

### `createHttp()`

Creates a new HTTP client instance.

### HTTP Methods

- `http.get(url, config?)`
- `http.post(url, data?, config?)`
- `http.put(url, data?, config?)`
- `http.patch(url, data?, config?)`
- `http.delete(url, config?)`
- `http.head(url, config?)`
- `http.options(url, config?)`
- `http.request(config)`

### Request Config

```typescript
interface RequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
  retry?: {
    count?: number;
    delay?: number;
    shouldRetry?: (error: any, attempt: number) => boolean;
  };
  transformRequest?: Transformer | Transformer[];
  transformResponse?: Transformer | Transformer[];
}
```

### Response Object

```typescript
interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}
```

## Advanced Examples

### Creating Multiple Instances

```typescript
// Create instances with different configs
const publicApi = createHttp();
const privateApi = createHttp();

// Configure private API with auth
privateApi.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['Authorization'] = `Bearer ${getToken()}`;
  return config;
});
```

### File Upload with Progress

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await http.post('https://api.example.com/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    console.log(`Upload Progress: ${percentCompleted}%`);
  }
});
```

### Caching Responses

```typescript
// Simple cache interceptor
const cache = new Map();

http.interceptors.request.use((config) => {
  if (config.method === 'GET') {
    const cached = cache.get(config.url);
    if (cached) {
      // Return cached response
      return Promise.reject({
        cached: true,
        response: cached
      });
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    if (response.config.method === 'GET') {
      cache.set(response.config.url, response);
    }
    return response;
  },
  (error) => {
    if (error.cached) {
      return error.response;
    }
    return Promise.reject(error);
  }
);
```

## Browser Support

- Chrome/Edge 42+
- Firefox 39+
- Safari 10.1+
- iOS Safari 10.3+
- Node.js 18+ (with fetch polyfill if needed)

## License

MIT