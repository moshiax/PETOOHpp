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
    var Petooh = function (options) {
        this.options = options || {};
        this.filter = new RegExp(/^[adehkKoOru]$/);
        this.log = this.options.log || function() {};
        this.cleanBrain();
    };

    Petooh.prototype.cleanBrain = function () {
        this.brain = [];
        this.result = [];
        this.buffer = '';
        this.stack = {};
        this.level = 0;
        this.currentPosition = 0;
        this.word = '';
        this.log('cleanBrain');
    };

    // ears of your rooster
    Petooh.prototype.listen = function (error, sound) {
        if (error) {
            this.peckError();
        }

        for (let i = 0; i < sound.length; i++) {
            let char = sound[i];
            if (!this.filter.test(char)) continue;

            let buffer = this.word + char;
            this.log(`listen: buffer=${buffer}, level=${this.level}, pos=${this.currentPosition}`);

            if (buffer === 'Ko') {
                this.level > 0
                    ? this.remember(buffer)
                    : this.increasePlz();
                this.forget();
            }
            else if (buffer === 'kO') {
                this.level > 0
                    ? this.remember(buffer)
                    : this.decreasePlz();
                this.forget();
            }
            else if (buffer === 'Kudah') {
                this.level > 0
                    ? this.remember(buffer)
                    : this.currentPosition++;
                this.forget();
            }
            else if (buffer === 'kudah') {
                this.level > 0
                    ? this.remember(buffer)
                    : this.currentPosition--;
                this.forget();
            }
            else if (this.word === 'Kud' && char !== 'a') {
                this.stack[++this.level] = [];
                this.forget(char);
            }
            else if (this.word === 'kud' && char !== 'a') {
                this.repeat();
                this.level--;
                this.forget(char);
            }
            else if (buffer === 'Kukarek') {
                this.level > 0
                    ? this.remember(buffer)
                    : this.success();
                this.forget();
            }
            else {
                this.word += char;
            }
        }
    };

	Petooh.prototype.repeat = function () {
		var self = this;
		while (this.brain[this.currentPosition] > 0) {
			this.stack[this.level].forEach(function (word) {
				if      (word === 'Ko')      { self.increasePlz(); }
				else if (word === 'kO')      { self.decreasePlz(); }
				else if (word === 'Kudah')   { self.currentPosition++; }
				else if (word === 'kudah')   { self.currentPosition--; }
				else if (word === 'Kukarek') { self.success(); }
			});
		}
	};

    // catch some error
    Petooh.prototype.peckError = function () {
        throw new Error('peck-peck');
    };

    Petooh.prototype.forget = function (sound) {
        this.word = sound === void 0 ? '' : sound;
    };

    Petooh.prototype.increasePlz = function () {
        if (this.currentPosition < 0) this.currentPosition = 0;
        this.brain[this.currentPosition] === void 0
            ? this.brain[this.currentPosition] = 1
            : this.brain[this.currentPosition]++;
        this.log(`increasePlz: brain[${this.currentPosition}]=${this.brain[this.currentPosition]}`);
    };

    Petooh.prototype.decreasePlz = function () {
        if (this.currentPosition < 0) this.currentPosition = 0;
        this.brain[this.currentPosition] === void 0
            ? this.brain[this.currentPosition] = 1
            : this.brain[this.currentPosition]--;
        this.log(`decreasePlz: brain[${this.currentPosition}]=${this.brain[this.currentPosition]}`);
    };

    Petooh.prototype.remember = function (word) {
        if (!this.stack[this.level]) {
            this.peckError();
        }

        this.stack[this.level].push(word);
        this.log(`remember: ${word} at level ${this.level}`);
    };

    Petooh.prototype.success = function () {
        this.result.push(String.fromCharCode(this.brain[this.currentPosition]));
        this.log(`success: result length=${this.result.length}`);
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
