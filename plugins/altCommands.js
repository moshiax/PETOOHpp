{
    name: "altCommands",
    desc: "Alternative functions names",
    fn: code => {
        const mapping = {
            "Ko": ["Ko", "OP_INC"],
            "kO": ["kO", "OP_DEC"],
            "Kudah": ["Kudah", "OP_INCPTR"],
            "kudah": ["kudah", "OP_DECPTR"],
            "Kukarek": ["Kukarek", "OP_OUT"],
            "Kud": ["Kud", "OP_JMP"],
            "kud": ["kud", "OP_RET"]
        };
        for (let standard in mapping) {
            const aliases = mapping[standard];
            for (let i = 1; i < aliases.length; i++) {
                const regex = new RegExp(aliases[i].replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), "g");
                code = code.replace(regex, standard);
            }
        }
        return code;
    },
    enabled: false
}