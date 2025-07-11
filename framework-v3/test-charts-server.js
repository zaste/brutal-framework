import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = createServer(async (req, res) => {
    let filePath = join(__dirname, req.url === '/' ? '/test-charts-diagnostic.html' : req.url);
    
    try {
        const ext = filePath.split('.').pop();
        const contentType = {
            'html': 'text/html',
            'js': 'application/javascript',
            'css': 'text/css'
        }[ext] || 'text/plain';
        
        const content = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (err) {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(8080, () => {
    });