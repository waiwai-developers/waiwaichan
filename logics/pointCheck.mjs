import models from '../models/index.js'
import dayjs from 'dayjs';
const Sequelize = require('sequelize');

export const pointCheck = async (userId) => {
    try {
        const pointConut = await models.Point.findAll({
			attributes: [[Sequelize.fn('COUNT', Sequelize.col('id'))]],
            where: {
                userId: userId,
                enable: models.Point.STATUS_VALID,
                expiredAt: {[Sequelize.Op.gte]: new Date().setMonth(dt.getMonth() -1)}
			}
        });

		if (pointConut === 0) return "ポイントがないよ！っ"

		return ( "以下のリマインドが予約されているよ！っ" + "\n" + texts.join("\n"));
    } catch (e) {
        console.error("Error:", e);
    }
};
