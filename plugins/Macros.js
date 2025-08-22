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