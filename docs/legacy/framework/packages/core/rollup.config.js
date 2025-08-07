import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'es',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      rootDir: './src'
    })
  ],
  external: [
    // Keep external dependencies external
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {})
  ]
};