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


## Extensions

| Command   | Description |
|-----------|-------------|
| Kokoko    | Add right neighbor cell to current cell            |
| kokoko    | Subtract right neighbor cell from current cell     |
| KOKO      | Multiply current cell by right neighbor cell       |
| koko      | Divide current cell by right neighbor cell (0 => 0)|
| Kooo      | Modulo current cell by right neighbor cell (0 => 0)|
| KooKoo    | Bitwise left shift current cell                    |
| kooKoo    | Bitwise right shift current cell                   |
| KooKo     | Bitwise AND current with right neighbor            |
| kooKo     | Bitwise OR current with right neighbor             |
| Kooko     | Bitwise XOR current with right neighbor            |
| KokoKud   | Swap current cell with right neighbor cell         |
| Kokokud   | Copy current cell into right neighbor cell         |
| Kukduk    | Output current cell as decimal integer             |
| Kukdku    | Read decimal integer into current cell             |
| Kukarekuk | Output zero-terminated string from current pointer |
| Kukaryku  | Read line into tape as zero-terminated string      |
| Kukudu    | Put random byte (0..255) into current cell         |
| Kudkuk    | Halt execution immediately                         |

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