const deeplapi = require('../repositorys/deeplapi/translate');

function waiwai() {
    try {
        return 'waiwai'
    } catch (e) {
        console.error("Error:", e)
    }
}

function parrot(parameter) {
    try {
        return parameter
    } catch (e) {
        console.error("Error:", e)
    }
}

function dice(parameter) {
    try {
        return Math.floor(Math.random() * (Number(parameter)) + 1).toString(10)
    } catch (e) {
        console.error("Error:", e)
    }
}

function choice(parameters) {
    try {
        return parameters[Math.floor(Math.random() * (Number(parameters.length))).toString(10)]
    } catch (e) {
        console.error("Error:", e)
    }
}

async function translate(texts, source, target) {
    try {
        const postMessages = []
        let translate = null
        for (const text of texts) {
          translate = await deeplapi.translate(text, source, target)
          postMessages.push(translate.text + '\n' + text)
        }
        return postMessages
    } catch (e) {
        console.error("Error:", e)
    }
}

module.exports = {
    waiwai,
    parrot,
    dice,
    choice,
    translate
}