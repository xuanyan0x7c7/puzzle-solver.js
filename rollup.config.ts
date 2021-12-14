import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
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
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    wasm({ maxFileSize: Infinity }),
    sourcemaps(),
  ],
};
