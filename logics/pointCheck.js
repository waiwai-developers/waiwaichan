import models from '../models/index.js'
import Sequelize from 'sequelize';

export const pointCheck = async (userId) => {
    try {
		const date = new Date()
        const points = await models.Point.findAndCountAll({
            where: {
                receiveUserId: userId,
                status: models.Point.STATUS_VALID,
                expiredAt: {[Sequelize.Op.gte]: date}
			}
        });

		if (points.count === 0) return "ポイントがないよ！っ";

		return ( `${points.count}` + "ポイントあるよ！っ");
    } catch (e) {
        console.error("Error:", e);
		return ("エラーが起こったよ！っ");
    }
};
