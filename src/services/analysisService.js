function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const generateAnalysis = async (target, competitor) => {

    await sleep(3000)

    return {
        target,
        competitor,
        strengths: ["Lower prices"],
        weaknesses: ["Poor delivery"]
    }

}

module.exports = { generateAnalysis };