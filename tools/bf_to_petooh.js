#!/usr/bin/env node

const fs = require('fs');

const map = {
  '+': 'Ko',
  '-': 'kO',
  '>': 'Kudah',
  '<': 'kudah',
  '.': 'Kukarek',
  ',': 'Kukareku',
  '[': 'Kud',
  ']': 'kud'
};

function transliterate(src) {
  const tokens = [...src].map(ch => map[ch]).filter(Boolean);

  const compressed = [];
  for (const token of tokens) {
    const prev = compressed[compressed.length - 1];
    if (!prev || prev.token !== token) {
      compressed.push({ token, count: 1 });
    } else {
      prev.count += 1;
    }
  }

  return compressed
    .map(({ token, count }) => (count > 1 ? `${token}^${count}` : token))
    .join(' ');
}

function processInput(input) {
  const result = transliterate(input);
  process.stdout.write(result.trim() + '\n');
}

const arg = process.argv[2];

if (!arg) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => processInput(data));
} else if (fs.existsSync(arg) && fs.statSync(arg).isFile()) {
  const content = fs.readFileSync(arg, 'utf8');
  processInput(content);
} else {
  processInput(arg);
}