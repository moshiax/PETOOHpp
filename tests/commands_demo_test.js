#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const Petooh = require('../petooh');
const compileToC = require('../tools/petooh_to_c');

function times(cmd, n) {
  return Array.from({ length: n }, () => cmd);
}

function assemble(parts) {
  return parts.flat().join('');
}

function runJs(code, input) {
  const vm = new Petooh({ input });
  vm.listen(false, code);
  return vm.told();
}

function runC(code, input) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'petooh-'));
  const cFile = path.join(dir, 'demo.c');
  const binFile = path.join(dir, 'demo');
  fs.writeFileSync(cFile, compileToC(code), 'utf8');
  cp.execFileSync('cc', [cFile, '-O2', '-o', binFile]);
  return cp.execFileSync(binFile, { input: input || '' }).toString();
}

const cases = [
  // Core commands
  { name: 'Ko (increment)', code: assemble([times('Ko', 65), 'Kukarek']), expected: 'A' },
  { name: 'kO (decrement)', code: assemble([times('Ko', 66), 'kO', 'Kukarek']), expected: 'A' },
  { name: 'Kudah (move right)', code: assemble(['Kudah', times('Ko', 65), 'Kukarek']), expected: 'A' },
  { name: 'kudah (move left)', code: assemble([times('Ko', 65), 'Kudah', 'kudah', 'Kukarek']), expected: 'A' },
  { name: 'Kukarek (char output)', code: assemble([times('Ko', 65), 'Kukarek']), expected: 'A' },
  { name: 'Kukareku (char input)', code: assemble(['Kukareku', 'Kukarek']), input: 'A', expected: 'A' },
  {
    name: 'Kud/kud (loop)',
    code: assemble([
      times('Ko', 5), 'Kud', 'Kudah', 'Ko', 'kudah', 'kO', 'kud',
      'Kudah', times('Ko', 60), 'Kukarek'
    ]),
    expected: 'A'
  },

  // Extensions
  { name: 'Kokoko', code: assemble([times('Ko', 30), 'Kudah', times('Ko', 35), 'kudah', 'Kokoko', 'Kukarek']), expected: 'A' },
  { name: 'kokoko', code: assemble([times('Ko', 90), 'Kudah', times('Ko', 25), 'kudah', 'kokoko', 'Kukarek']), expected: 'A' },
  { name: 'KOKO', code: assemble([times('Ko', 13), 'Kudah', times('Ko', 5), 'kudah', 'KOKO', 'Kukarek']), expected: 'A' },
  { name: 'koko', code: assemble([times('Ko', 130), 'Kudah', times('Ko', 2), 'kudah', 'koko', 'Kukarek']), expected: 'A' },
  { name: 'Kooo', code: assemble([times('Ko', 135), 'Kudah', times('Ko', 70), 'kudah', 'Kooo', 'Kukarek']), expected: 'A' },
  { name: 'KooKoo', code: assemble([times('Ko', 160), 'kooKoo', 'Kukarek']), expected: 'P' },
  { name: 'kooKoo', code: assemble([times('Ko', 130), 'kooKoo', 'Kukarek']), expected: 'A' },
  { name: 'KooKo', code: assemble([times('Ko', 97), 'Kudah', times('Ko', 65), 'kudah', 'KooKo', 'Kukarek']), expected: 'A' },
  { name: 'kooKo', code: assemble([times('Ko', 64), 'Kudah', 'Ko', 'kudah', 'kooKo', 'Kukarek']), expected: 'A' },
  { name: 'Kooko', code: assemble([times('Ko', 96), 'Kudah', 'Ko', 'kudah', 'Kooko', 'Kukarek']), expected: 'a' },
  { name: 'KokoKud', code: assemble([times('Ko', 65), 'Kudah', times('Ko', 66), 'kudah', 'KokoKud', 'Kukarek']), expected: 'B' },
  { name: 'Kokokud', code: assemble([times('Ko', 65), 'Kokokud', 'Kudah', 'Kukarek']), expected: 'A' },
  { name: 'Kukduk', code: assemble([times('Ko', 65), 'Kukduk']), expected: '65' },
  { name: 'Kukdku', code: assemble(['Kukdku', 'Kukarek']), input: '65', expected: 'A' },
  { name: 'Kukarekuk', code: assemble([times('Ko', 72), 'Kudah', times('Ko', 73), 'kudah', 'Kukarekuk']), expected: 'HI' },
  { name: 'Kukaryku', code: assemble(['Kukaryku', 'Kukarekuk']), input: 'HELLO\n', expected: 'HELLO' },
  { name: 'Kudkuk', code: assemble([times('Ko', 65), 'Kudkuk', 'Ko', 'Kukarek']), expected: '' }
];

for (const t of cases) {
  const jsOut = runJs(t.code, t.input || '');
  const cOut = runC(t.code, t.input || '');

  if (jsOut !== t.expected) {
    throw new Error('JS mismatch for ' + t.name + ': expected "' + t.expected + '", got "' + jsOut + '"');
  }
  if (cOut !== t.expected) {
    throw new Error('C mismatch for ' + t.name + ': expected "' + t.expected + '", got "' + cOut + '"');
  }
  if (jsOut !== cOut) {
    throw new Error('JS/C mismatch for ' + t.name + ': js="' + jsOut + '", c="' + cOut + '"');
  }

  process.stdout.write('[OK] ' + t.name + ' -> ' + JSON.stringify(jsOut) + '\n');
}

const randomProgram = assemble(['Kukudu', 'Kukduk']);
const jsNum = Number(runJs(randomProgram, ''));
const cNum = Number(runC(randomProgram, ''));
if (!Number.isInteger(jsNum) || jsNum < 0 || jsNum > 255) {
  throw new Error('Kukudu JS out of range: ' + jsNum);
}
if (!Number.isInteger(cNum) || cNum < 0 || cNum > 255) {
  throw new Error('Kukudu C out of range: ' + cNum);
}
process.stdout.write('[OK] Kukudu range check JS=' + jsNum + ' C=' + cNum + '\n');

console.log('All command demos passed.');
