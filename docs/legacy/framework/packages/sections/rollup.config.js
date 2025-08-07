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
      sourcemap: true
    }
  ],
  external: ['@nwc/core'],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist'
    })
  ]
};