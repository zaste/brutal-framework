import { createServer } from 'http';
import { readFile, access, constants } from 'fs';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    // Parse URL
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Security: prevent directory traversal
    const safePath = normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = join(__dirname, safePath);
    
    // Check if file exists
    access(fullPath, constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`<h1>404 Not Found</h1><p>The requested URL ${req.url} was not found.</p>`);
            return;
        }
        
        // Read and serve file
        readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end(`Error loading file: ${err.message}`);
                return;
            }
            
            // Set content type
            const ext = extname(fullPath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            // Add CORS headers for ES modules
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 Native Framework v2 Demo Server (ES Modules)
==============================================
Server running at http://localhost:${PORT}

Demo Hub: http://localhost:${PORT}/

Key Demos:
- Full Integration: http://localhost:${PORT}/demos/full-integration-demo.html
- Hero Showcase: http://localhost:${PORT}/demos/showcase/hero-demo.html
- Stress Test: http://localhost:${PORT}/tests/stress-test-brutal.html

Press Ctrl+C to stop the server.
    `);
});