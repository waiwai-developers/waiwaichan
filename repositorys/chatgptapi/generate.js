const { openaiApiKey, gptModel, gptPrompt} = require('../../config.json');
const OpenAI = require("openai")
const openai = new OpenAI({apiKey: openaiApiKey});

async function generate(text) {
  try {
    return await openai.chat.completions.create({
        model: gptModel,
        messages: [
            {"role": "system", "content":gptPrompt},
            {"role": "user","content": text}
        ]
    });
  } catch (e) {
    console.error("Error:", e)
    interaction.reply('エラーが起こったよ！っ')
  }
}

module.exports = { generate }
