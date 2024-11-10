import config from "../config/commands.json" with { type: "json" };

export const help = (category) => {
	try {
		const texts = config.filter((c) => (category === "all" || c.category.name === category) ).map((c) =>
			[`## ${c.category.name}`,
				...c.category.commands.map((command) =>
					[
						`- \`${command.name}\``,
						`  - 値　　： ${command.parameter}`,
						`  - 例　　： ${command.example}`,
						`  - 説明　： ${command.description}`
					].join("\n")
				)
			].join("\n")
		)
		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};

