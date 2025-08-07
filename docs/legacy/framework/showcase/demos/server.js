/**
 * SIMPLE DEV SERVER FOR NATIVE WEB COMPONENTS FRAMEWORK DEMO
 * Basic HTTP server to serve the demo files
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Default to index.html
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Add CORS headers for ES modules
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 Not Found</title></head>
                        <body>
                            <h1>404 - File Not Found</h1>
                            <p>The requested file <code>${req.url}</code> was not found.</p>
                            <p><a href="/">Back to Demo</a></p>
                        </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 Native Web Components Framework Demo Server
==============================================
Server running at: http://localhost:${PORT}
Demo available at: http://localhost:${PORT}/

Features:
✅ Native Web Components
✅ ES Modules Support
✅ CORS Headers
✅ Live Demo Environment

Press Ctrl+C to stop the server
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down demo server...');
    server.close(() => {
        console.log('✅ Demo server stopped');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});