const config = require('../config/commands.json');

export const help = () => {
    try {
        const texts = config.map((c) =>
            [
                `- \`${c.name}\``,
                `  - parameter: ${c.parameter}`,
                `  - example: ${c.example}`,
                `  - description: ${c.description}`
            ].join("\n")
        )
        return texts.join("\n");
    } catch (e) {
        console.error("Error:", e)
    }
}