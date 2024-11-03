const { openaiApiKey, gptModel, gptPrompt } = require("../../config.json");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: openaiApiKey });

async function generate(messages) {
	try {
		return await openai.chat.completions.create({
			model: gptModel,
			messages: messages,
		});
	} catch (e) {
		console.error("Error:", e);
	}
}

module.exports = { generate };
