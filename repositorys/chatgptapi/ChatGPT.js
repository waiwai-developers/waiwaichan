import OpenAI from "openai";
import config from "../../config.json" with { type: "json" };
const openai = new OpenAI({ apiKey: config.openaiApiKey });

export const generate = async (messages) => {
	try {
		return await openai.chat.completions.create({
			model: config.gptModel,
			messages: messages,
		});
	} catch (e) {
		console.error("Error:", e);
	}
};
