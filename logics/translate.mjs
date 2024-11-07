import { requestTransrate } from "../repositorys/deeplapi/translate.mjs";
export const translate = async (messages, source, target) => {
	try {
		const texts = messages.split("  ")
		if (texts == null) return "messageパラメーターがないよ！っ";
		if (source == null) return "sourceパラメーターがないよ！っ";
		if (target == null) return "targetパラメーターがないよ！っ";
		if (source === target) return "sourceとtargetが同じだよ！っ";

		const postMessages = [];
		let translate = null;
		for (const text of texts) {
			translate = await requestTransrate(text, source, target);
			postMessages.push(`${translate.text}\n${text}`);
		}

		if (postMessages == []) return "翻訳できなかったよ！っ";

		return postMessages.join("\n\n");
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};
