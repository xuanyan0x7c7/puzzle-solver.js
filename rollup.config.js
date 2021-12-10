import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: {
    sourcemap: true,
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [
    typescript(),
    sourcemaps(),
  ],
};
