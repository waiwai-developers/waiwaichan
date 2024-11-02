const deepl = require('deepl-node');
const { deeplApiKey } = require('../../config.json');

const translator = new deepl.Translator(deeplApiKey);

async function translate(text, source, target) {
    try {
        return await translator.translateText(text, source, target);
    } catch (e) {
        console.error("Error:", e)
    }
};

module.exports = { translate }
