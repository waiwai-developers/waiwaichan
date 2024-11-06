export const parrot = (message) => {
	try {
		if(!message) return "パラメーターがないよ！っ";

		return message;
	} catch (e) {
		console.error("Error:", e);
	}
};
