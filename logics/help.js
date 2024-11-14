import config from "../config/commands.json" with { type: "json" };

export const help = (category) => {
	try {
		const texts = config.categories
			.filter((c) => category === "all" || c.name === category)
			.flatMap((c) => [
				`## ${c.name}`,
				...c.commands.map((command) =>
					[
						`- \`${command.name}\``,
						`  - 値　　： ${command.parameter}`,
						`  - 例　　： ${command.example}`,
						`  - 説明　： ${command.description}`,
					].join("\n"),
				),
			]);
		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
