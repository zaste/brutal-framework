#!/usr/bin/env node

/**
 * Setup all packages with tsup config
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = path.join(__dirname, '../packages/@brutal');

const tsupConfig = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  external: [/@brutal\\//],
  treeshake: true,
  skipNodeModulesBundle: true,
  onSuccess: 'echo "✅ Build successful"'
});
`;

// Create tsup config for each package
const packages = fs.readdirSync(PACKAGES_DIR);
packages.forEach(pkg => {
  const packagePath = path.join(PACKAGES_DIR, pkg);
  if (fs.statSync(packagePath).isDirectory()) {
    const configPath = path.join(packagePath, 'tsup.config.ts');
    fs.writeFileSync(configPath, tsupConfig);
    console.log(`✅ Created tsup config for @brutal/${pkg}`);
  }
});

console.log('\n✨ All packages configured!');