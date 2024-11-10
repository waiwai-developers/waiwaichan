import config from "../config/commands.json" with { type: "json" };

export const help = () => {
	try {
		const texts = config.map((c) =>
			[`## ${c.category.name}`,
				c.category.commands.map((command) =>
					[
						`- \`${command.name}\``,
						`  - 値　　： ${command.parameter}`,
						`  - 例　　： ${command.example}`,
						`  - 説明　： ${command.description}`
					].join("\n")
				).join("\n")
			].join("\n")
		)
		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};

