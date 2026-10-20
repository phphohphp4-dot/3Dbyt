const fs = require('node:fs');
const path = require('node:path');
const { compile } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');

// Build directly from source, including on a fresh clone without a .next cache.
module.exports = async function buildTourCss(root) {
  const compiler = await compile(fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8'), {
    base: path.join(root, 'app'),
    onDependency() {},
  });
  const scanner = new Scanner({
    sources: ['app', 'components', 'lib', 'scripts'].map(dir => ({
      base: path.join(root, dir).replaceAll('\\', '/'),
      pattern: '**/*.{ts,tsx,js}',
      negated: false,
    })),
  });
  return compiler.build(scanner.scan());
};
