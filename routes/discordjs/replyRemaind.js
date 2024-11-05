const { Client,GatewayIntentBits } = require("discord.js");
const { token } = require("../../config.json");
const models = require('../../models/index.js');
const Sequelize = require('sequelize');
const client = new Client({
    intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});
setInterval(async () => {
    try {
        const remainders = await models.Reminder.findAll({
            where: {remindAt: {[Sequelize.Op.lte]: new Date()}}
        });

    for (const remainder of remainders) {
        await client.channels.cache.get(remainder.channelId).send((`<@${remainder.userId}>` + "\n"+ remainder.message))
        await remainder.destroy();
    }
  } catch (e) {
    console.error("Error:", e);
  }
}, 10000);
client.login(token);
