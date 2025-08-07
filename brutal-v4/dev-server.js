/**
 * Development server for BRUTAL V4
 * Properly serves ES modules and handles paths
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

async function serveFile(res, filePath) {
    try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        
        res.end(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`404 Not Found: ${filePath}`);
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`500 Server Error: ${err.message}`);
        }
    }
}

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Remove query string
    const url = req.url.split('?')[0];
    
    // Determine file path
    let filePath;
    
    if (url === '/') {
        // Redirect to the actual demo location
        res.writeHead(302, { 'Location': '/testing/demo.html' });
        res.end();
        return;
    } else {
        // Direct file mapping
        filePath = path.join(__dirname, url);
    }
    
    // Security check
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }
    
    // Check if it's a directory and serve index.html
    try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            // Try index.html first
            const indexPath = path.join(filePath, 'index.html');
            try {
                await fs.access(indexPath);
                filePath = indexPath;
            } catch {
                // If no index.html, try demo.html
                const demoPath = path.join(filePath, 'demo.html');
                try {
                    await fs.access(demoPath);
                    filePath = demoPath;
                } catch {
                    // List directory contents
                    const files = await fs.readdir(filePath);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                        <head><title>Directory: ${url}</title></head>
                        <body>
                            <h1>Directory: ${url}</h1>
                            <ul>
                                ${url !== '/' ? '<li><a href="../">../</a></li>' : ''}
                                ${files.map(f => `<li><a href="${url}${url.endsWith('/') ? '' : '/'}${f}">${f}</a></li>`).join('')}
                            </ul>
                        </body>
                        </html>
                    `);
                    return;
                }
            }
        }
    } catch (err) {
        // File doesn't exist, will be handled by serveFile
    }
    
    await serveFile(res, filePath);
});

server.listen(PORT, () => {
    console.log(`
🔥 BRUTAL V4 Development Server
================================
Server running at: http://localhost:${PORT}

Direct links:
- Demo: http://localhost:${PORT}/testing/demo.html
- Simple test: http://localhost:${PORT}/simple-test.html
- Import test: http://localhost:${PORT}/test-imports.html

Press Ctrl+C to stop
    `);
});