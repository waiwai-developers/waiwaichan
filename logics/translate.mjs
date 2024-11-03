export const translate = async (texts, source, target) => {
	try {
		const postMessages = [];
		let translate = null;
		for (const text of texts) {
			translate = await deeplapi.translate(text, source, target);
			postMessages.push(`${translate.text}\n${text}`);
		}
		return postMessages;
	} catch (e) {
		console.error("Error:", e);
	}
};
