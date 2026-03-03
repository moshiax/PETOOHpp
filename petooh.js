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

    function asInputByte(value) {
        if (value === null || value === void 0) {
            return 0;
        }
        if (typeof value === 'number') {
            return clampByte(value);
        }
        return clampByte(String(value).charCodeAt(0) || 0);
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
        return this.readCellAt(this.pointer);
    };

    Petooh.prototype.readCellAt = function (index) {
        return this.tape[index] === void 0 ? 0 : this.tape[index];
    };

    Petooh.prototype.writeCell = function (value) {
        this.tape[this.pointer] = clampByte(value);
    };

    Petooh.prototype.execCore = function (token) {
        switch (token) {
        case 'Ko':
            this.writeCell(this.readCell() + 1);
            return;
        case 'kO':
            this.writeCell(this.readCell() - 1);
            return;
        case 'Kudah':
            this.pointer++;
            return;
        case 'kudah':
            this.pointer--;
            return;
        case 'Kukarek':
            this.result.push(String.fromCharCode(this.readCell()));
            return;
        case 'Kukareku':
            this.writeCell(this.readInput());
        }
    };

    Petooh.prototype.repeatCore = function (token, count) {
        for (var i = 0; i < count; i++) {
            this.execCore(token);
        }
    };

    Petooh.prototype.writeCellWithCore = function (value) {
        var target = clampByte(value);
        var current = this.readCell();

        this.repeatCore('kO', current);
        this.repeatCore('Ko', target);
    };

    Petooh.prototype.readInput = function () {
        var input = this.options.input;

        if (typeof input === 'function') {
            return asInputByte(input(this.inputOffset++));
        }

        var raw = input === void 0 ? '' : String(input);
        if (this.inputOffset >= raw.length) {
            this.inputOffset++;
            return 0;
        }

        return asInputByte(raw.charCodeAt(this.inputOffset++));
    };

    Petooh.prototype.readNumericInput = function () {
        var input = this.options.input;
        var source;

        if (typeof input === 'function') {
            source = input(this.inputOffset++);
            source = source === null || source === void 0 ? '0' : String(source);
        }
        else {
            source = input === void 0 ? '' : String(input).slice(this.inputOffset);
            this.inputOffset += source.length;
        }

        source = parseInt(source, 10);
        this.writeCell(Number.isFinite(source) ? source : 0);
    };

    Petooh.prototype.readLineToTape = function () {
        var rawInput = this.options.input === void 0 ? '' : String(this.options.input);
        var line = rawInput.slice(this.inputOffset).split(/\r?\n/)[0];
        var i;

        this.inputOffset += line.length;
        for (i = 0; i < line.length; i++) {
            this.tape[this.pointer + i] = line.charCodeAt(i);
        }
        this.tape[this.pointer + line.length] = 0;
    };

    Petooh.prototype.execToken = function (token, cell) {
        var right;
        var i;

        switch (token) {
        case 'Ko':
        case 'kO':
        case 'Kudah':
        case 'kudah':
        case 'Kukarek':
        case 'Kukareku':
            this.execCore(token);
            return;
        case 'Kukduk':
            this.result.push(String(cell));
            return;
        case 'Kukdku':
            this.readNumericInput();
            return;
        case 'Kokoko':
            this.repeatCore('Ko', this.readCellAt(this.pointer + 1));
            return;
        case 'kokoko':
            this.repeatCore('kO', this.readCellAt(this.pointer + 1));
            return;
        case 'KOKO':
            right = this.readCellAt(this.pointer + 1);
            this.writeCellWithCore(0);
            for (i = 0; i < cell; i++) {
                this.repeatCore('Ko', right);
            }
            return;
        case 'koko':
            right = this.readCellAt(this.pointer + 1);
            this.writeCellWithCore(right === 0 ? 0 : Math.floor(cell / right));
            return;
        case 'Kooo':
            right = this.readCellAt(this.pointer + 1);
            this.writeCellWithCore(right === 0 ? 0 : cell % right);
            return;
        case 'KooKoo':
            this.writeCellWithCore(cell << 1);
            return;
        case 'kooKoo':
            this.writeCellWithCore(cell >> 1);
            return;
        case 'KooKo':
            this.writeCellWithCore(cell & this.readCellAt(this.pointer + 1));
            return;
        case 'kooKo':
            this.writeCellWithCore(cell | this.readCellAt(this.pointer + 1));
            return;
        case 'Kooko':
            this.writeCellWithCore(cell ^ this.readCellAt(this.pointer + 1));
            return;
        case 'KokoKud':
            right = this.readCellAt(this.pointer + 1);
            this.tape[this.pointer + 1] = cell;
            this.writeCell(right);
            return;
        case 'Kokokud':
            this.tape[this.pointer + 1] = cell;
            return;
        case 'Kukarekuk':
            i = this.pointer;
            while (this.readCellAt(i) !== 0) {
                this.result.push(String.fromCharCode(this.readCellAt(i++)));
            }
            return;
        case 'Kukaryku':
            this.readLineToTape();
            return;
        case 'Kukudu':
            this.writeCell(Math.floor(Math.random() * 256));
        }
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

            if (token === 'Kud') {
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
            else {
                this.execToken(token, cell);
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


    return Petooh;
}));
