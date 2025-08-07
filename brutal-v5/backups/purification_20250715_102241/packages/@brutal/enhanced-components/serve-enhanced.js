import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Map workspace dependencies to their dist locations
const workspaceMap = {
  '@brutal/components': '../components/dist/index.js',
  '@brutal/events': '../events/dist/index.js',
  '@brutal/shared': '../shared/dist/index.js',
  '@brutal/templates': '../templates/dist/index.js'
};

const server = createServer((req, res) => {
  try {
    if (req.url === '/test.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Enhanced Components Test</title>
  <script type="importmap">
  {
    "imports": {
      "@brutal/components": "/workspace/components/index.js",
      "@brutal/events": "/workspace/events/index.js",
      "@brutal/shared": "/workspace/shared/index.js",
      "@brutal/templates": "/workspace/templates/index.js"
    }
  }
  </script>
  <script type="module">
    // Import all enhanced components from the built bundle
    import * as BrutalEnhanced from './dist/index.js';
    
    // Make them available globally for tests
    window.BrutalEnhanced = BrutalEnhanced;
    console.log('BrutalEnhanced loaded:', BrutalEnhanced);
  </script>
</head>
<body>
  <div id="test-container"></div>
  <div id="modal"></div>
</body>
</html>
      `);
    } else if (req.url?.startsWith('/dist/')) {
      // Serve built files
      const filePath = join(__dirname, req.url);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    } else if (req.url?.startsWith('/workspace/')) {
      // Serve workspace dependencies
      const packageName = req.url.replace('/workspace/', '').replace('/index.js', '');
      const workspacePath = `@brutal/${packageName}`;
      
      if (workspaceMap[workspacePath]) {
        const filePath = resolve(__dirname, workspaceMap[workspacePath]);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(content);
        } else {
          res.writeHead(404);
          res.end(`Workspace file not found: ${filePath}`);
        }
      } else {
        res.writeHead(404);
        res.end(`Unknown workspace: ${workspacePath}`);
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end(`Server error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3334;
server.listen(PORT, () => {
  console.log(`Enhanced test server running at http://localhost:${PORT}`);
});