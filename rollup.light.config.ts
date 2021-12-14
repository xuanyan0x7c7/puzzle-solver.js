import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/light.ts',
  output: [
    {
      file: 'dist/light.js',
      format: 'umd',
      name: 'puzzle-solver',
      sourcemap: true,
    },
    {
      file: 'dist/light.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript(),
    sourcemaps(),
  ],
};
