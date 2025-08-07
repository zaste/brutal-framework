#!/usr/bin/env node
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const server = createServer((req, res) => {
  let filePath = join(__dirname, req.url === '/' ? 'test-browser-integration.html' : req.url);
  
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`\n🚀 BRUTAL V5 Test Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});