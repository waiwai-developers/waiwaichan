import config from "../config/commands.json" with { type: "json" };

export const help = () => {
	try {
		const texts = config.map((c) =>
			[
				`- \`${c.name}\``,
				`  - パラメータ: ${c.parameter}`,
				`  - 例: ${c.example}`,
				`  - 説明: ${c.description}`,
			].join("\n"),
		);
		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};
