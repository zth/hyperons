/**
 * @type {import('vite').UserConfig}
 */
export default {
  build: {
    minify: false,
    lib: {
      entry: 'src/index.js',
      name: 'hyperons',
      formats: ['es'],
      target: 'node18',
      fileName: (format) => `hyperons.${format}.js`
    }
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  },
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov']
    }
  }
}
