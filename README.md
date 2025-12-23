# PETOOH++ 🐓

**PETOOH++** --- a web-based interpreter for the [PETOOH](https://github.com/Ky6uk/PETOOH) with plugin support.

------------------------------------------------------------------------

## Features

-   Interpret PETOOH code directly in the browser.
-   Macros support (example`Ko^5 → KoKoKoKoKo`).
-   Plugins: add, enable/disable, edit, and delete.
-   Console functions support

------------------------------------------------------------------------
## Basics

| Command | Description |
|---------|-------------|
| `Ko`    | Increment the byte at the data pointer |
| `kO`    | Decrement the byte at the data pointer |
| `Kudah` | Increment the data pointer (move right) |
| `kudah` | Decrement the data pointer (move left) |
| `Kukarek` | Output the byte at the data pointer as an ASCII character |
| `Kud`   | If current cell is zero, skip the loop/block |
| `kud`   | If current cell is nonzero, repeat the loop/block |

------------------------------------------------------------------------

## 🐓 Example PETOOH++ Code with Macros plugin

```petooh
Ko^80 Kukarek kO^11 Kukarek Ko^15 Kukarek kO^5 Kukarek^2 kO^7 Kukarek kO^29 Kukarek^2
> PETOOH++
```

## Example: Hello World! (with Macros plugin)

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

------------------------------------------------------------------------

## 🔌 Plugins

### Built-in Plugins

1.  **altCommands** --- adds support for alternative userdefined command names
    (`OP_INC`, `OP_DEC`, etc.).\
    *(disabled by default)*
2.  **Macros** --- macro expansion for shorthands.\
    *(enabled by default)*

### Example Custom Plugin

A plugin that replaces COCK to Kukarek:

``` js
function(code){
  return code.replace(/COCK/g, "Kukarek");
}
```

------------------------------------------------------------------------

## 🛠 API (PetoohRunner)

### Create a Runner

``` js
const runner = new PetoohRunner({
    plugins: [
        {
            name: "Macros",
            desc: "Custom macros",
            fn: code => {
                const macros = [
                    code => code.replace(/([a-zA-Z]+)\^(\d+)/g, (_, cmd, times) => cmd.repeat(+times)),
                ];
                for (const fn of macros) {
                    try {
                        code = fn(code);
                    } catch (e) {
                        console.error("Macro error", e);
                    }
                }
                return code;
            },
            enabled: true
        }
    ],
    logTarget: msg => console.warn("Petooh log:", msg)
});
```

### Run Code

``` js
runner.run("Ko^80 Kukarek kO^11 Kukarek Ko^15 Kukarek kO^5 Kukarek Kukarek kO^7 Kukarek kO^29 Kukarek Kukarek"); 
> 'PETOOH++'
```

### Manage Plugins

``` js
runner.addPlugin({
  name: "COCK",
  desc: "A plugin that replaces COCK to Kukarek",
  fn: code => code.replace(/COCK/g, "Kukarek"),
  enabled: true
})
```

------------------------------------------------------------------------
