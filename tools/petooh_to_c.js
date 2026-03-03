#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Petooh = require('../petooh');

function compileToC(code, options) {
  const compiler = new Petooh(options || {});
  const tokens = compiler.tokenize(compiler.expandMacros(code));
  compiler.buildJumpTable(tokens);

  const tokenSet = new Set(tokens);
  const needsStdio = (
    tokenSet.has('Kukarek') || tokenSet.has('Kukduk') || tokenSet.has('Kukareku') || tokenSet.has('Kukdku') ||
    tokenSet.has('Kukaryku') || tokenSet.has('Kukarekuk')
  );
  const needsStdlib = tokenSet.has('Kukudu');
  const needsTime = tokenSet.has('Kukudu');
  const needsHaltLabel = tokenSet.has('Kudkuk');

  const lines = [
    needsStdio ? '#include <stdio.h>' : '',
    '#include <stdint.h>',
    '#include <string.h>',
    needsStdlib ? '#include <stdlib.h>' : '',
    needsTime ? '#include <time.h>' : '',
    '',
    '#define TAPE_SIZE 30000',
    '',
    'int main(void) {',
    '  uint8_t tape[TAPE_SIZE] = {0};',
    '  int ptr = 0;'
  ];

  if (tokenSet.has('Kukudu')) {
    lines.push('  srand((unsigned)time(NULL));');
  }

  let indent = '  ';

  function emit(line) {
    lines.push(indent + line);
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === 'Ko' || t === 'kO') {
      let count = 1;
      while (tokens[i + count] === t) count++;
      emit('tape[ptr] = (uint8_t)(tape[ptr] ' + (t === 'Ko' ? '+' : '-') + ' ' + count + ');');
      i += count - 1;
      continue;
    }

    if (t === 'Kudah' || t === 'kudah') {
      let step = 1;
      while (tokens[i + step] === t) step++;
      emit('ptr = (ptr ' + (t === 'Kudah' ? '+' : '-') + ' ' + step + ' + TAPE_SIZE) % TAPE_SIZE;');
      i += step - 1;
      continue;
    }

    if (t === 'Kud') {
      emit('while (tape[ptr]) {');
      indent += '  ';
      continue;
    }

    if (t === 'kud') {
      indent = indent.slice(2);
      emit('}');
      continue;
    }

    if (t === 'Kudkuk') {
      emit('goto PETOOH_END;');
      continue;
    }

    switch (t) {
      case 'Kukarek':
        emit('putchar(tape[ptr]);');
        break;
      case 'Kukduk':
        emit('printf("%u", (unsigned)tape[ptr]);');
        break;
      case 'Kukareku':
        emit('{ int c = getchar(); tape[ptr] = (uint8_t)(c == EOF ? 0 : c); }');
        break;
      case 'Kukdku':
        emit('{ unsigned n = 0; if (scanf("%u", &n) != 1) n = 0; tape[ptr] = (uint8_t)n; }');
        break;
      case 'Kokoko':
        emit('tape[ptr] = (uint8_t)(tape[ptr] + tape[(ptr + 1) % TAPE_SIZE]);');
        break;
      case 'kokoko':
        emit('tape[ptr] = (uint8_t)(tape[ptr] - tape[(ptr + 1) % TAPE_SIZE]);');
        break;
      case 'KOKO':
        emit('tape[ptr] = (uint8_t)(tape[ptr] * tape[(ptr + 1) % TAPE_SIZE]);');
        break;
      case 'koko':
        emit('{ uint8_t d = tape[(ptr + 1) % TAPE_SIZE]; tape[ptr] = (uint8_t)(d ? tape[ptr] / d : 0); }');
        break;
      case 'Kooo':
        emit('{ uint8_t d = tape[(ptr + 1) % TAPE_SIZE]; tape[ptr] = (uint8_t)(d ? tape[ptr] % d : 0); }');
        break;
      case 'KooKoo':
        emit('tape[ptr] = (uint8_t)(tape[ptr] << 1);');
        break;
      case 'kooKoo':
        emit('tape[ptr] = (uint8_t)(tape[ptr] >> 1);');
        break;
      case 'KooKo':
        emit('tape[ptr] = (uint8_t)(tape[ptr] & tape[(ptr + 1) % TAPE_SIZE]);');
        break;
      case 'kooKo':
        emit('tape[ptr] = (uint8_t)(tape[ptr] | tape[(ptr + 1) % TAPE_SIZE]);');
        break;
      case 'Kooko':
        emit('tape[ptr] = (uint8_t)(tape[ptr] ^ tape[(ptr + 1) % TAPE_SIZE]);');
        break;
      case 'KokoKud':
        emit('{ int r = (ptr + 1) % TAPE_SIZE; uint8_t v = tape[ptr]; tape[ptr] = tape[r]; tape[r] = v; }');
        break;
      case 'Kokokud':
        emit('tape[(ptr + 1) % TAPE_SIZE] = tape[ptr];');
        break;
      case 'Kukarekuk':
        emit('{ int s = ptr; while (tape[s]) { putchar(tape[s]); s = (s + 1) % TAPE_SIZE; } }');
        break;
      case 'Kukaryku':
        emit("{ int s = ptr, c; while ((c = getchar()) != EOF && c != '\\n' && c != '\\r') { tape[s] = (uint8_t)c; s = (s + 1) % TAPE_SIZE; } tape[s] = 0; }");
        break;
      case 'Kukudu':
        emit('tape[ptr] = (uint8_t)(rand() % 256);');
        break;
      default:
        break;
    }
  }

  if (needsHaltLabel) {
    lines.push('PETOOH_END:');
  }
  lines.push('  return 0;');
  lines.push('}');

  return lines.filter(Boolean).join('\n');
}

module.exports = compileToC;

if (require.main === module) {
  const [, , sourceArg, outputArg] = process.argv;
  if (!sourceArg) {
    console.error('Usage: node tools/petooh_to_c.js <source.petooh|inline_code> [output.c]');
    process.exit(1);
  }

  const src = fs.existsSync(sourceArg)
    ? fs.readFileSync(sourceArg, 'utf8')
    : sourceArg;

  const cCode = compileToC(src);

  if (outputArg) {
    fs.writeFileSync(path.resolve(outputArg), cCode, 'utf8');
  } else {
    process.stdout.write(cCode + '\n');
  }
}
