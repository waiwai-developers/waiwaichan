import OpenAI from "openai";
import { gptModel, openaiApiKey } from "../../config.json" with {
	type: "json",
};
const openai = new OpenAI({ apiKey: openaiApiKey });

export const generate = async (messages) => {
	try {
		return await openai.chat.completions.create({
			model: gptModel,
			messages: messages,
		});
	} catch (e) {
		console.error("Error:", e);
	}
};
