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
    needsStdio ? '#include<stdio.h>' : '',
    needsStdlib ? '#include<stdlib.h>' : '',
    needsTime ? '#include<time.h>' : '',
    '#define TAPE_SIZE 30000',
    'int main(){unsigned char t[TAPE_SIZE]={0};int p=0;'
  ];

  if (tokenSet.has('Kukudu')) {
    lines.push('srand((unsigned)time(0));');
  }

  let indent = '';

  function emit(line) {
    lines.push(indent + line);
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === 'Ko' || t === 'kO') {
      let count = 1;
      while (tokens[i + count] === t) count++;
      emit('t[p]' + (t === 'Ko' ? '+' : '-') + '=' + count + ';');
      i += count - 1;
      continue;
    }

    if (t === 'Kudah' || t === 'kudah') {
      let step = 1;
      while (tokens[i + step] === t) step++;
      emit('p=(p' + (t === 'Kudah' ? '+' : '-') + step + '+TAPE_SIZE)%TAPE_SIZE;');
      i += step - 1;
      continue;
    }

    if (t === 'Kud') {
      emit('while(t[p]){');
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
        emit('putchar(t[p]);');
        break;
      case 'Kukduk':
        emit('printf("%u",(unsigned)t[p]);');
        break;
      case 'Kukareku':
        emit('{int c=getchar();t[p]=c<0?0:c;}');
        break;
      case 'Kukdku':
        emit('if(scanf("%hhu",t+p)<1)t[p]=0;');
        break;
      case 'Kokoko':
        emit('t[p]+=t[(p+1)%TAPE_SIZE];');
        break;
      case 'kokoko':
        emit('t[p]-=t[(p+1)%TAPE_SIZE];');
        break;
      case 'KOKO':
        emit('t[p]*=t[(p+1)%TAPE_SIZE];');
        break;
      case 'koko':
        emit('{unsigned char d=t[(p+1)%TAPE_SIZE];t[p]=d?t[p]/d:0;}');
        break;
      case 'Kooo':
        emit('{unsigned char d=t[(p+1)%TAPE_SIZE];t[p]=d?t[p]%d:0;}');
        break;
      case 'KooKoo':
        emit('t[p]<<=1;');
        break;
      case 'kooKoo':
        emit('t[p]>>=1;');
        break;
      case 'KooKo':
        emit('t[p]&=t[(p+1)%TAPE_SIZE];');
        break;
      case 'kooKo':
        emit('t[p]|=t[(p+1)%TAPE_SIZE];');
        break;
      case 'Kooko':
        emit('t[p]^=t[(p+1)%TAPE_SIZE];');
        break;
      case 'KokoKud':
        emit('{int r=(p+1)%TAPE_SIZE;unsigned char v=t[p];t[p]=t[r];t[r]=v;}');
        break;
      case 'Kokokud':
        emit('t[(p+1)%TAPE_SIZE]=t[p];');
        break;
      case 'Kukarekuk':
        emit('{int s=p;while(t[s]){putchar(t[s]);s=(s+1)%TAPE_SIZE;}}');
        break;
      case 'Kukaryku':
        emit("{int s=p,c;while((c=getchar())!=EOF&&c!='\\n'&&c!='\\r'){t[s]=c;s=(s+1)%TAPE_SIZE;}t[s]=0;}");
        break;
      case 'Kukudu':
        emit('t[p]=rand()%256;');
        break;
      default:
        break;
    }
  }

  if (needsHaltLabel) {
    lines.push('PETOOH_END:');
  }
  lines.push('return 0;');
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
