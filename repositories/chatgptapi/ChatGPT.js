import OpenAI from "openai";
import config from "../../config.json" with { type: "json" };
const openai = new OpenAI({ apiKey: config.openai.openaiApiKey });

export const generate = async (messages) => {
	try {
		return await openai.chat.completions.create({
			model: config.openai.gptModel,
			messages: messages,
		});
	} catch (e) {
		console.error("Error:", e);
	}
};
