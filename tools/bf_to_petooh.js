#!/usr/bin/env node

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

const src = process.argv[2] || '';

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

const out = compressed
  .map(({ token, count }) => (count > 1 ? `${token}^${count}` : token))
  .join(' ');

process.stdout.write(out.trim() + '\n');