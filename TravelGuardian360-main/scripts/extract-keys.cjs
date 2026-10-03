// Collects every string passed to t('...') in src/ and writes scripts/keys.json.
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOT = path.join(__dirname, '..', 'src');
const EXTRA = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== 'i18n') walk(full, out);
    } else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

const keys = new Set(EXTRA);
for (const file of walk(ROOT)) {
  const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    CallExpression(p) {
      if (p.node.callee.type !== 'Identifier' || p.node.callee.name !== 't') return;
      const first = p.node.arguments[0];
      if (!first) return;
      const literals = first.type === 'ConditionalExpression' ? [first.consequent, first.alternate] : [first];
      literals.forEach((l) => {
        if (l.type === 'StringLiteral') keys.add(l.value);
      });
    },
  });
}
fs.writeFileSync(path.join(__dirname, 'keys.json'), JSON.stringify([...keys].sort(), null, 1));
console.log(`${keys.size} strings`);
