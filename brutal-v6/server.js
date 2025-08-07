#!/usr/bin/env node
/**
 * Simple HTTP server for testing examples
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

createServer(async (req, res) => {
  try {
    let filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    const content = await readFile(filePath);
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`🚀 BRUTAL dev server running at http://localhost:${PORT}`);
  console.log(`📍 Counter example: http://localhost:${PORT}/packages/@brutal/core/examples/counter.html`);
});