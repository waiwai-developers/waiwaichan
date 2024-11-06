export const choice = (items) => {
	try {
		if (items == null) return "パラメーターがないよ！っ";

		const itemNames = items.split(" ")

		return itemNames[Math.floor(Math.random() * Number(itemNames.length)).toString(10)];
	} catch (e) {
		console.error("Error:", e);
	}
};
