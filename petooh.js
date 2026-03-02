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
    var TOKEN_RE = /(Kukareku|Kukarek|Kudah|kudah|Kud|kud|Ko|kO)/g;
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

		var lines = [
			'#include <stdio.h>',
			'#include <stdint.h>',
			'#include <string.h>',
			'',
			'#define TAPE_SIZE 30000',
			'',
			'int main(void) {',
			'  uint8_t tape[TAPE_SIZE];',
			'  memset(tape, 0, sizeof(tape));',
			'  int ptr = 0;'
		];

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
			else if (t === 'Kukareku') {
				lines.push(indent + '{ int c = getchar(); tape[ptr] = (c == EOF) ? 0 : (uint8_t)c; }');
			}
			else if (t === 'Kud') {
				lines.push(indent + 'while (tape[ptr]) {');
				indent += '  ';
			}
			else if (t === 'kud') {
				indent = indent.slice(2);
				lines.push(indent + '}');
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
