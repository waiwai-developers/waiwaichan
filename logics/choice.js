export const choice = (parameters) => {
    try {
        return parameters[Math.floor(Math.random() * (Number(parameters.length))).toString(10)]
    } catch (e) {
        console.error("Error:", e)
    }
}