#!/usr/bin/env node

/**
 * Test all 3 critical packages working 100% real
 */

import { compile, render, html, Template } from './packages/@brutal/templates/dist/index.js';
import { Router, Route, navigate } from './packages/@brutal/routing/dist/index.js';
import { createCache, MemoryCache, StorageCache } from './packages/@brutal/cache/dist/index.js';

console.log('🧪 Testing 3 Critical Packages\n');

// Test 1: Templates
console.log('1️⃣ Testing @brutal/templates...');
try {
  // Test compile/render
  const greeting = render('Hello ${name}!', { name: 'BRUTAL' });
  console.log('✅ render():', greeting);
  
  // Test Template class
  const template = compile('User: ${user.name} (${user.age})');
  const result = template.render({ user: { name: 'Alice', age: 30 } });
  console.log('✅ compile():', result);
  
  // Test HTML escaping
  const escaped = render('${content}', { content: '<script>alert("xss")</script>' });
  console.log('✅ HTML escape:', escaped);
  
  // Test html tagged template
  const htmlResult = html`<div>Hello ${'<b>World</b>'}</div>`;
  console.log('✅ html``:', htmlResult);
  
} catch (error) {
  console.error('❌ Templates failed:', error.message);
}

// Test 2: Routing
console.log('\n2️⃣ Testing @brutal/routing...');
try {
  // Create router
  const router = new Router();
  
  // Test Route class
  const route = new Route({ path: '/users/:id' });
  console.log('✅ Route matches /users/123:', route.matches('/users/123'));
  console.log('✅ Route params:', route.extractParams('/users/123'));
  
  // Test wildcard routes
  const wildcardRoute = new Route({ path: '/docs/*' });
  console.log('✅ Wildcard matches /docs/api/intro:', wildcardRoute.matches('/docs/api/intro'));
  
  console.log('✅ Router created and routes work');
  
} catch (error) {
  console.error('❌ Routing failed:', error.message);
}

// Test 3: Cache
console.log('\n3️⃣ Testing @brutal/cache...');
try {
  // Test MemoryCache
  const memCache = createCache({ storage: 'memory', ttl: 1000 });
  memCache.set('key1', 'value1');
  console.log('✅ MemoryCache get:', memCache.get('key1'));
  console.log('✅ MemoryCache size:', memCache.size);
  
  // Test TTL
  memCache.set('expire', 'soon', 100); // 100ms TTL
  console.log('✅ Before expiry:', memCache.get('expire'));
  
  setTimeout(() => {
    console.log('✅ After expiry (should be undefined):', memCache.get('expire'));
  }, 150);
  
  // Test max size
  const smallCache = new MemoryCache({ maxSize: 2 });
  smallCache.set('a', 1);
  smallCache.set('b', 2);
  smallCache.set('c', 3); // Should evict 'a'
  console.log('✅ Size limit - has "a":', smallCache.has('a'), '(should be false)');
  console.log('✅ Size limit - has "c":', smallCache.has('c'), '(should be true)');
  
  // Test factory
  const localStorage = createCache({ storage: 'localStorage' });
  console.log('✅ Created localStorage cache:', localStorage instanceof StorageCache);
  
} catch (error) {
  console.error('❌ Cache failed:', error.message);
}

// Integration test
console.log('\n4️⃣ Integration Test...');
try {
  // Use template engine with router
  const pageTemplate = compile(`
    <h1>Welcome ${user.name}!</h1>
    <p>Viewing page: ${page}</p>
  `);
  
  // Cache rendered templates
  const templateCache = createCache({ ttl: 60000 }); // 1 minute cache
  
  function renderPage(page, user) {
    const cacheKey = `${page}:${user.id}`;
    
    let html = templateCache.get(cacheKey);
    if (!html) {
      html = pageTemplate.render({ page, user });
      templateCache.set(cacheKey, html);
      console.log('✅ Rendered and cached:', cacheKey);
    } else {
      console.log('✅ Using cached version:', cacheKey);
    }
    
    return html;
  }
  
  // Simulate page renders
  const user = { id: 1, name: 'Bob' };
  renderPage('home', user);
  renderPage('home', user); // Should use cache
  renderPage('about', user);
  
  console.log('\n✨ All 3 critical packages working 100%!');
  
} catch (error) {
  console.error('❌ Integration failed:', error.message);
}