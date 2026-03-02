#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Petooh = require('../petooh');

const [, , sourceArg, outputArg] = process.argv;
if (!sourceArg) {
  console.error('Usage: node tools/petooh_to_c.js <source.petooh|inline_code> [output.c]');
  process.exit(1);
}

const src = fs.existsSync(sourceArg)
  ? fs.readFileSync(sourceArg, 'utf8')
  : sourceArg;

const cCode = Petooh.compileToC(src);

if (outputArg) {
  fs.writeFileSync(path.resolve(outputArg), cCode, 'utf8');
} else {
  process.stdout.write(cCode + '\n');
}
