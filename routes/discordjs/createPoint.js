const { Client,GatewayIntentBits } = require("discord.js");
const { token } = require('../../config.json');
const models = require('../../models/index.js');
const Sequelize = require('sequelize');
const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});
client.on("", () => {
  console.log(`login: ${client.user.tag}`);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.author.bot) return;
  // if (user.id === reaction.message.author.bot) return;

  if (reaction.emoji.name === '🍬') {
    const date = new Date()
    const points = await models.Point.findAndCountAll({
      where: {
        giveUserId: user.id,
        createdAt: {[Sequelize.Op.gte]: date.setDate(date.getDate() -1)}
      }
    });

    if (points.count > 2) {
      await reaction.message.channel.send(`もう今日はスタンプを押してもポイントは増えないよ！っ`);
      return;
    }

		await models.Point.create({
      receiveUserId: user.id,
      giveUserId: reaction.message.author.id,
      messageId: reaction.message.id,
      status: models.Point.STATUS_VALID,
      expiredAt: date.setMonth(date.getMonth() +1)
		});

    await reaction.message.channel.send(`ありがと！っ<@${user.id}>さんが🍬スタンプを押したよ！！っ`);
  }
});


client.login(token);