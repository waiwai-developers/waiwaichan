import { requestTransrate } from "../repositorys/deeplapi/translate.mjs";
export const translate = async (texts, source, target) => {
	try {
		const postMessages = [];
		let translate = null;
		for (const text of texts) {
			translate = await requestTransrate(text, source, target);
			postMessages.push(`${translate.text}\n${text}`);
		}
		return postMessages;
	} catch (e) {
		console.error("Error:", e);
	}
};
