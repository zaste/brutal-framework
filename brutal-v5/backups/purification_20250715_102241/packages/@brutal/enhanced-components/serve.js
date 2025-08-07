import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = createServer((req, res) => {
  if (req.url === '/test.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Enhanced Components Test</title>
  <script type="module">
    // Import all enhanced components from the built bundle
    import * as BrutalEnhanced from './dist/index.js';
    
    // Extract the components
    const { Portal, LazyComponent, VisibilityTracker, ObserverComponent, AsyncComponent } = BrutalEnhanced;
    
    // Define custom elements
    customElements.define('brutal-portal', Portal);
    customElements.define('brutal-lazy', LazyComponent);
    customElements.define('brutal-async', AsyncComponent);
    
    // Make them available globally for tests
    window.BrutalEnhanced = BrutalEnhanced;
  </script>
</head>
<body>
  <div id="test-container"></div>
  <div id="modal"></div>
</body>
</html>
    `);
  } else if (req.url?.startsWith('/dist/')) {
    try {
      const filePath = join(__dirname, req.url);
      const content = readFileSync(filePath);
      const contentType = req.url.endsWith('.js') ? 'application/javascript' : 'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404);
      res.end('Not found');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});