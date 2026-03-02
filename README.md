# PETOOH++ 🐓

**PETOOH++** is a Turing-complete PETOOH variant with a web runtime, built-in `^` macros, C compilation support, and conversion tools.

## Features

- Instruction set including input (`Kukareku`) and loops (`Kud`/`kud`).
- `^` macro expansion is built into the language core:
  - `Ko^80` -> 80 increments.
  - `Kukarek^2` -> two output operations.
- `PETOOH++ -> C` compiler output for native builds (`cc`, `clang`, `gcc (redhat virus)`).
- JavaScript `Brainfuck -> PETOOH++` converter.

## Core Commands

| Command  | Description                                  |
| -------- | ---------------------------------------------|
| Ko       | Increment current cell                       |
| kO       | Decrement current cell                       |
| Kudah    | Move pointer right                           |
| kudah    | Move pointer left                            |
| Kukarek  | Output current cell as a character           |
| Kukareku | Read one input byte into current cell        |
| Kud      | Loop start (while current cell != 0)         |
| kud      | Loop end                                     |

## `^` Macros

Supported form:

```txt
<command>^<number>
```

## Example: Hello World!

```petooh
Ko^72 Kukarek
Kudah Ko^101 Kukarek
Kudah Ko^108 Kukarek
Kukarek
Kudah Ko^111 Kukarek
Kudah Ko^32 Kukarek
Kudah Ko^87 Kukarek
Kudah Ko^111 Kukarek
Kudah Ko^114 Kukarek
Kudah Ko^108 Kukarek
Kudah Ko^100 Kukarek
Kudah Ko^33 Kukarek
```

## Runtime Usage (JS API)

```js
const Petooh = require('./petooh');

const vm = new Petooh({ input: 'A' });
vm.listen(null, 'Kukareku Kukarek');
console.log(vm.told()); // A
```
## Convert Brainfuck to PETOOH++

```bash
node tools/bf_to_petooh.js "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."
```

## Compile PETOOH++ to C

```bash
node tools/petooh_to_c.js "Ko^65 Kukarek" A.c
cc A.c -O2 -o A
A
```

## Plugins

Plugins (preprocessors) are supported in the web interface