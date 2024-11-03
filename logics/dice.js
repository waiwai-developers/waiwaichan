export const dice = (parameter) => {
    try {
        return Math.floor(Math.random() * (Number(parameter)) + 1).toString(10)
    } catch (e) {
        console.error("Error:", e)
    }
}