function parrot(parameter) {
    try {
        return parameter
    } catch (e) {
        console.error("Error:", e)
    }
}

module.exports = {
    parrot,
}