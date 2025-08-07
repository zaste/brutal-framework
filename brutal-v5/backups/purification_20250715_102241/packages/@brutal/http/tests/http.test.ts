import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createHttp } from '../src/index';

// Mock fetch
global.fetch = jest.fn();

describe('@brutal/http', () => {
  let http: any;
  
  beforeEach(() => {
    http = createHttp();
    jest.clearAllMocks();
  });

  describe('Basic requests', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const response = await http.get('https://api.example.com/data');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers)
        })
      );
      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
    });

    it('should make POST request with data', async () => {
      const postData = { name: 'test' };
      const mockResponse = { id: 1, ...postData };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const response = await http.post('https://api.example.com/users', postData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.any(Headers)
        })
      );
      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(201);
    });

    it('should make PUT request', async () => {
      const putData = { name: 'updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => putData
      });

      const response = await http.put('https://api.example.com/users/1', putData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData)
        })
      );
    });

    it('should make DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        json: async () => null
      });

      const response = await http.delete('https://api.example.com/users/1');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(response.status).toBe(204);
    });
  });

  describe('Query parameters', () => {
    it('should append query params to URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await http.get('https://api.example.com/data', {
        params: { foo: 'bar', baz: 123 }
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data?foo=bar&baz=123',
        expect.any(Object)
      );
    });

    it('should handle array params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await http.get('https://api.example.com/data', {
        params: { tags: ['a', 'b', 'c'] }
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data?tags=a&tags=b&tags=c',
        expect.any(Object)
      );
    });
  });

  describe('Headers', () => {
    it('should send custom headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await http.get('https://api.example.com/data', {
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom': 'value'
        }
      });
      
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;
      expect(headers.get('Authorization')).toBe('Bearer token');
      expect(headers.get('X-Custom')).toBe('value');
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptor', async () => {
      http.interceptors.request.use((config: any) => {
        config.headers = config.headers || {};
        config.headers['X-Intercepted'] = 'true';
        return config;
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await http.get('https://api.example.com/data');
      
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;
      expect(headers.get('X-Intercepted')).toBe('true');
    });

    it('should apply response interceptor', async () => {
      http.interceptors.response.use((response: any) => {
        response.data = { ...response.data, intercepted: true };
        return response;
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ original: true })
      });

      const response = await http.get('https://api.example.com/data');
      expect(response.data).toEqual({ original: true, intercepted: true });
    });

    it('should handle interceptor errors', async () => {
      http.interceptors.request.use(
        (config: any) => config,
        (error: any) => {
          error.intercepted = true;
          return Promise.reject(error);
        }
      );

      http.interceptors.request.use(() => {
        throw new Error('Interceptor error');
      });

      await expect(http.get('https://api.example.com/data')).rejects.toThrow('Interceptor error');
    });

    it('should eject interceptor', async () => {
      const id = http.interceptors.request.use((config: any) => {
        config.headers = config.headers || {};
        config.headers['X-Should-Not-Exist'] = 'true';
        return config;
      });

      http.interceptors.request.eject(id);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      await http.get('https://api.example.com/data');
      
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;
      expect(headers.get('X-Should-Not-Exist')).toBeNull();
    });
  });

  describe('Transformers', () => {
    it('should transform request data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      });

      const transformer = (data: any) => ({ wrapped: data });
      
      await http.post('https://api.example.com/data', { test: true }, {
        transformRequest: transformer
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          body: JSON.stringify({ wrapped: { test: true } })
        })
      );
    });

    it('should transform response data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ result: 'test' })
      });

      const transformer = (data: any) => data.result;
      
      const response = await http.get('https://api.example.com/data', {
        transformResponse: transformer
      });
      
      expect(response.data).toBe('test');
    });

    it('should chain multiple transformers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ value: 1 })
      });

      const transformers = [
        (data: any) => ({ ...data, value: data.value * 2 }),
        (data: any) => ({ ...data, value: data.value + 10 })
      ];
      
      const response = await http.get('https://api.example.com/data', {
        transformResponse: transformers
      });
      
      expect(response.data.value).toBe(12); // (1 * 2) + 10
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Not found' })
      });

      await expect(http.get('https://api.example.com/data')).rejects.toThrow('Request failed with status 404');
    });

    it('should include response in error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Invalid data' })
      });

      try {
        await http.get('https://api.example.com/data');
      } catch (error: any) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual({ error: 'Invalid data' });
      }
    });
  });

  describe('Timeout', () => {
    it('should timeout request', async () => {
      jest.useFakeTimers();
      
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({})
          }), 2000);
        })
      );

      const promise = http.get('https://api.example.com/data', { timeout: 1000 });
      
      jest.advanceTimersByTime(1000);
      
      await expect(promise).rejects.toThrow();
      
      jest.useRealTimers();
    });
  });

  describe('Retry', () => {
    it('should retry failed requests', async () => {
      let attempts = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true })
        });
      });

      const response = await http.get('https://api.example.com/data', {
        retry: { count: 3, delay: 10 }
      });

      expect(attempts).toBe(3);
      expect(response.data).toEqual({ success: true });
    });

    it('should use custom retry logic', async () => {
      let attempts = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Network error'));
      });

      const shouldRetry = jest.fn((error, attempt) => attempt < 2);

      await expect(
        http.get('https://api.example.com/data', {
          retry: { count: 5, delay: 10, shouldRetry }
        })
      ).rejects.toThrow('Network error');

      expect(shouldRetry).toHaveBeenCalledTimes(3);
      expect(attempts).toBe(3);
    });
  });

  describe('Content types', () => {
    it('should handle text responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Hello World'
      });

      const response = await http.get('https://api.example.com/data');
      expect(response.data).toBe('Hello World');
    });

    it('should handle blob responses', async () => {
      const blob = new Blob(['binary data']);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        blob: async () => blob
      });

      const response = await http.get('https://api.example.com/data');
      expect(response.data).toBe(blob);
    });
  });
});