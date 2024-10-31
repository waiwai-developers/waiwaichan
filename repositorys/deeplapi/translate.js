const deepl = require('deepl-node');
const { deeplApiKey } = require('../../config.json');

const translator = new deepl.Translator(deeplApiKey);

async function translate(text, source, target) {
    return await translator.translateText(text, source, target);
};

module.exports = { translate }
