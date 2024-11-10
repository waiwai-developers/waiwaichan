import Sequelize from "sequelize";
import { Point } from "../models/index.js";

export const pointCheck = async (userId) => {
	try {
		const date = new Date();
		const points = await Point.findAndCountAll({
			where: {
				receiveUserId: userId,
				status: Point.STATUS_VALID,
				expiredAt: { [Sequelize.Op.gte]: date },
			},
		});

		if (points.count === 0) return "ポイントがないよ！っ";

		return `${points.count}ポイントあるよ！っ`;
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
