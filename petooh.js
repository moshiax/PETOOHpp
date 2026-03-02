/* globals define */
/* jshint node: true */

(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else if (typeof exports === 'object') {
        module.exports = factory();
    }
    else {
        root.Petooh = factory();
    }
}(this, function () {
    'use strict';

    // constructor desu
    var TOKENS = [
        'Kukarekuk',
        'Kukaryku',
        'KokoKud',
        'Kokokud',
        'Kudkuk',
        'Kukareku',
        'Kukarek',
        'Kukduk',
        'Kukdku',
        'KooKoo',
        'kooKoo',
        'KooKo',
        'kooKo',
        'Kooko',
        'Kokoko',
        'kokoko',
        'KOKO',
        'koko',
        'Kooo',
        'Kukudu',
        'Kudah',
        'kudah',
        'Kud',
        'kud',
        'Ko',
        'kO'
    ];
    var TOKEN_RE = new RegExp(TOKENS.slice().sort(function (a, b) {
        return b.length - a.length;
    }).join('|'), 'g');
    var MACRO_RE = /([a-zA-Z]+)\^(\d+)/g;

    function clampByte(value) {
        var x = value % 256;
        return x < 0 ? x + 256 : x;
    }

    var Petooh = function (options) {
        this.options = options || {};
        this.log = this.options.log || function () {};
        this.cleanBrain();
    };

    Petooh.prototype.cleanBrain = function () {
        this.pointer = 0;
        this.tape = Object.create(null);
        this.result = [];
        this.inputOffset = 0;
        this.log('cleanBrain');
    };

    // ears of your rooster
    Petooh.prototype.expandMacros = function (code) {
        return String(code || '').replace(MACRO_RE, function (_, cmd, times) {
            var count = Number(times);
            if (!Number.isFinite(count) || count < 0) {
                throw new Error('Invalid macro repeat: ' + times);
            }
            return cmd.repeat(count);
        });
    };

    Petooh.prototype.tokenize = function (code) {
        return (String(code || '').match(TOKEN_RE) || []);
    };

    Petooh.prototype.buildJumpTable = function (tokens) {
        var jump = {};
        var stack = [];

        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] === 'Kud') {
                stack.push(i);
            }
            else if (tokens[i] === 'kud') {
                if (stack.length === 0) {
                    throw new Error('Unbalanced loop: kud without Kud at token ' + i);
                }
                var open = stack.pop();
                jump[open] = i;
                jump[i] = open;
            }
        }

        if (stack.length > 0) {
            throw new Error('Unbalanced loop: missing kud for Kud at token ' + stack.pop());
        }

        return jump;
    };

    Petooh.prototype.readCell = function () {
        return this.tape[this.pointer] === void 0 ? 0 : this.tape[this.pointer];
    };

    Petooh.prototype.readCellAt = function (index) {
        return this.tape[index] === void 0 ? 0 : this.tape[index];
    };

    Petooh.prototype.writeCell = function (value) {
        this.tape[this.pointer] = clampByte(value);
    };

    Petooh.prototype.readInput = function () {
        var input = this.options.input;

        if (typeof input === 'function') {
            var produced = input(this.inputOffset++);
            if (produced === null || produced === void 0) {
                return 0;
            }
            if (typeof produced === 'number') {
                return clampByte(produced);
            }
            return clampByte(String(produced).charCodeAt(0) || 0);
        }

        var raw = input === void 0 ? '' : String(input);
        if (this.inputOffset >= raw.length) {
            this.inputOffset++;
            return 0;
        }

        return raw.charCodeAt(this.inputOffset++);
    };

    Petooh.prototype.listen = function (error, sound) {
        if (error) {
            this.peckError();
        }

        var expanded = this.expandMacros(sound);
        var tokens = this.tokenize(expanded);
        var jump = this.buildJumpTable(tokens);

        for (var ip = 0; ip < tokens.length; ip++) {
            var token = tokens[ip];
            var cell = this.readCell();

            if (token === 'Ko') {
                this.writeCell(cell + 1);
            }
            else if (token === 'kO') {
                this.writeCell(cell - 1);
            }
            else if (token === 'Kudah') {
                this.pointer++;
            }
            else if (token === 'kudah') {
                this.pointer--;
            }
            else if (token === 'Kukarek') {
                this.result.push(String.fromCharCode(cell));
            }
            else if (token === 'Kukareku') {
                this.writeCell(this.readInput());
            }
            else if (token === 'Kukduk') {
                this.result.push(String(cell));
            }
            else if (token === 'Kukdku') {
                var input = this.options.input;
                var source = '';
                if (typeof input === 'function') {
                    var fromFn = input(this.inputOffset++);
                    source = fromFn === null || fromFn === void 0 ? '0' : String(fromFn);
                }
                else {
                    source = input === void 0 ? '' : String(input).slice(this.inputOffset);
                    this.inputOffset += source.length;
                }
                var parsed = parseInt(source, 10);
                this.writeCell(Number.isFinite(parsed) ? parsed : 0);
            }
            else if (token === 'Kokoko') {
                this.writeCell(cell + this.readCellAt(this.pointer + 1));
            }
            else if (token === 'kokoko') {
                this.writeCell(cell - this.readCellAt(this.pointer + 1));
            }
            else if (token === 'KOKO') {
                this.writeCell(cell * this.readCellAt(this.pointer + 1));
            }
            else if (token === 'koko') {
                var divisor = this.readCellAt(this.pointer + 1);
                this.writeCell(divisor === 0 ? 0 : Math.floor(cell / divisor));
            }
            else if (token === 'Kooo') {
                var mod = this.readCellAt(this.pointer + 1);
                this.writeCell(mod === 0 ? 0 : cell % mod);
            }
            else if (token === 'KooKoo') {
                this.writeCell(cell << 1);
            }
            else if (token === 'kooKoo') {
                this.writeCell(cell >> 1);
            }
            else if (token === 'KooKo') {
                this.writeCell(cell & this.readCellAt(this.pointer + 1));
            }
            else if (token === 'kooKo') {
                this.writeCell(cell | this.readCellAt(this.pointer + 1));
            }
            else if (token === 'Kooko') {
                this.writeCell(cell ^ this.readCellAt(this.pointer + 1));
            }
            else if (token === 'KokoKud') {
                var rightCell = this.readCellAt(this.pointer + 1);
                this.tape[this.pointer + 1] = cell;
                this.writeCell(rightCell);
            }
            else if (token === 'Kokokud') {
                this.tape[this.pointer + 1] = cell;
            }
            else if (token === 'Kukarekuk') {
                var savedPointer = this.pointer;
                while (this.readCell() !== 0) {
                    this.result.push(String.fromCharCode(this.readCell()));
                    this.pointer++;
                }
                this.pointer = savedPointer;
            }
            else if (token === 'Kukaryku') {
                var rawInput = this.options.input === void 0 ? '' : String(this.options.input);
                var line = rawInput.slice(this.inputOffset).split(/\r?\n/)[0];
                this.inputOffset += line.length;
                for (var li = 0; li < line.length; li++) {
                    this.tape[this.pointer + li] = line.charCodeAt(li);
                }
                this.tape[this.pointer + line.length] = 0;
            }
            else if (token === 'Kukudu') {
                this.writeCell(Math.floor(Math.random() * 256));
            }
            else if (token === 'Kud') {
                if (cell === 0) {
                    ip = jump[ip];
                }
            }
            else if (token === 'kud') {
                if (cell !== 0) {
                    ip = jump[ip] - 1;
                }
            }
            else if (token === 'Kudkuk') {
                break;
            }
        }
    };

    Petooh.prototype.peckError = function () {
        throw new Error('peck-peck');
    };

    Petooh.prototype.told = function () {
        var result = this.result.join('');
        if (this.options.cleanBrain) {
            this.cleanBrain();
        }
        return result;
    };

	Petooh.prototype.compileToC = function (code) {
		var tokens = this.tokenize(this.expandMacros(code));
		this.buildJumpTable(tokens);
		var tokenSet = Object.create(null);
		for (var ti = 0; ti < tokens.length; ti++) {
			tokenSet[tokens[ti]] = true;
		}

		var needsStdio = (
			tokenSet.Kukarek || tokenSet.Kukduk || tokenSet.Kukareku || tokenSet.Kukdku ||
			tokenSet.Kukaryku || tokenSet.Kukarekuk
		);
		var needsStdlib = tokenSet.Kukudu;
		var needsTime = tokenSet.Kukudu;

		var lines = [
			needsStdio ? '#include <stdio.h>' : '',
			'#include <stdint.h>',
			'#include <string.h>',
			needsStdlib ? '#include <stdlib.h>' : '',
			needsTime ? '#include <time.h>' : '',
			'',
			'#define TAPE_SIZE 30000',
			'',
			'int main(void) {',
			'  uint8_t tape[TAPE_SIZE];',
			'  memset(tape, 0, sizeof(tape));',
			'  int ptr = 0;'
		];

		if (tokenSet.Kukudu) {
			lines.push('  srand((unsigned)time(NULL));');
		}

		var indent = '  ';

		for (var i = 0; i < tokens.length; i++) {
			var t = tokens[i];

			if (t === 'Ko' || t === 'kO') {
				var count = 1;
				while (tokens[i + count] === t) count++;

				if (t === 'Ko') {
					lines.push(indent + 'tape[ptr] += ' + count + ';');
				} else {
					lines.push(indent + 'tape[ptr] -= ' + count + ';');
				}

				i += count - 1;
			}

			else if (t === 'Kudah' || t === 'kudah') {
				var step = 1;
				while (tokens[i + step] === t) step++;

				if (t === 'Kudah') {
					lines.push(indent + 'ptr = (ptr + ' + step + ') % TAPE_SIZE;');
				} else {
					lines.push(indent + 'ptr = (ptr - ' + step + ' + TAPE_SIZE) % TAPE_SIZE;');
				}

				i += step - 1;
			}

			else if (t === 'Kukarek') {
				lines.push(indent + 'putchar(tape[ptr]);');
			}
			else if (t === 'Kukduk') {
				lines.push(indent + 'printf("%u", (unsigned)tape[ptr]);');
			}
			else if (t === 'Kukareku') {
				lines.push(indent + '{ int c = getchar(); tape[ptr] = (c == EOF) ? 0 : (uint8_t)c; }');
			}
			else if (t === 'Kukdku') {
				lines.push(indent + '{ unsigned n = 0; if (scanf("%u", &n) != 1) n = 0; tape[ptr] = (uint8_t)n; }');
			}
			else if (t === 'Kokoko') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] + tape[(ptr + 1) % TAPE_SIZE]);');
			}
			else if (t === 'kokoko') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] - tape[(ptr + 1) % TAPE_SIZE]);');
			}
			else if (t === 'KOKO') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] * tape[(ptr + 1) % TAPE_SIZE]);');
			}
			else if (t === 'koko') {
				lines.push(indent + '{ uint8_t d = tape[(ptr + 1) % TAPE_SIZE]; tape[ptr] = d ? (uint8_t)(tape[ptr] / d) : 0; }');
			}
			else if (t === 'Kooo') {
				lines.push(indent + '{ uint8_t d = tape[(ptr + 1) % TAPE_SIZE]; tape[ptr] = d ? (uint8_t)(tape[ptr] % d) : 0; }');
			}
			else if (t === 'KooKoo') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] << 1);');
			}
			else if (t === 'kooKoo') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] >> 1);');
			}
			else if (t === 'KooKo') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] & tape[(ptr + 1) % TAPE_SIZE]);');
			}
			else if (t === 'kooKo') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] | tape[(ptr + 1) % TAPE_SIZE]);');
			}
			else if (t === 'Kooko') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(tape[ptr] ^ tape[(ptr + 1) % TAPE_SIZE]);');
			}
			else if (t === 'KokoKud') {
				lines.push(indent + '{ uint8_t tmp = tape[ptr]; tape[ptr] = tape[(ptr + 1) % TAPE_SIZE]; tape[(ptr + 1) % TAPE_SIZE] = tmp; }');
			}
			else if (t === 'Kokokud') {
				lines.push(indent + 'tape[(ptr + 1) % TAPE_SIZE] = tape[ptr];');
			}
			else if (t === 'Kukaryku') {
				lines.push(indent + '{ int s = ptr; while (tape[s]) { putchar(tape[s]); s = (s + 1) % TAPE_SIZE; } }');
			}
			else if (t === 'Kukarekuk') {
				lines.push(indent + '{ int s = ptr; int c; while ((c = getchar()) != EOF && c != "\\n"[0] && c != "\\r"[0]) { tape[s] = (uint8_t)c; s = (s + 1) % TAPE_SIZE; } tape[s] = 0; }');
			}
			else if (t === 'Kukudu') {
				lines.push(indent + 'tape[ptr] = (uint8_t)(rand() % 256);');
			}
			else if (t === 'Kud') {
				lines.push(indent + 'while (tape[ptr]) {');
				indent += '  ';
			}
			else if (t === 'kud') {
				indent = indent.slice(2);
				lines.push(indent + '}');
			}
			else if (t === 'Kudkuk') {
				lines.push(indent + 'break;');
			}
		}

		lines.push('  return 0;');
		lines.push('}');

		return lines.join('\n');
	};

    Petooh.compileToC = function (code, options) {
        var compiler = new Petooh(options || {});
        return compiler.compileToC(code);
    };

    return Petooh;
}));
