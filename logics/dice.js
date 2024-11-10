export const dice = (parameter) => {
	try {
		if (parameter == null) return "パラメーターがないよ！っ";

		const param = Number(parameter);

		if (!Number.isInteger(param)) return "パラメーターが整数じゃないよ！っ";
		if (param <= 0) return "パラメーターが0以下の数だよ！っ";

		return Math.floor(Math.random() * param + 1).toString(10);
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
