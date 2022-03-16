import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'puzzle-solver',
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: /\.wasm$/,
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    copy({
      targets: [{ src: ['src/**/*.wasm', 'src/**/*.wasm.d.ts'], dest: 'dist' }],
      flatten: false,
    }),
    sourcemaps(),
  ],
});
