import * as deepl from "deepl-node";
import config from "../../config.json" with { type: "json" };

const translator = new deepl.Translator(config.deepl.deeplApiKey);

export const requestTransrate = async (text, source, target) => {
	try {
		return await translator.translateText(text, source, target);
	} catch (e) {
		console.error("Error:", e);
	}
};
