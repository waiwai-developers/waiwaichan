import Sequelize from "sequelize";
import models from "../models/index.js";

export const pointDraw = async (userId) => {
	const t = await models.sequelize.transaction();
	try {
		const date = new Date();
		const point = await models.Point.findOne({
			where: {
				receiveUserId: userId,
				status: models.Point.STATUS_VALID,
				expiredAt: { [Sequelize.Op.gte]: date },
			},
			order: [["expiredAt", "ASC"]],
		});

		if (!point) return "ポイントがないよ！っ";

		await models.Point.update(
			{ status: models.Point.STATUS_INVALID },
			{ where: { id: point.id } },
			{ transaction: t },
		);

		// NOTE:todo より良い乱数生成に変える
		const randomNum = Math.floor(
			Math.random() * models.Item.PROBABILITY_JACKPOD + 1,
		);

		if (randomNum % models.Item.PROBABILITY_HIT !== 0) {
			await t.commit();
			return "ハズレちゃったよ！っ";
		}

		let userItem = null;
		if (randomNum % models.Item.PROBABILITY_JACKPOD === 0) {
			userItem = await models.UserItem.create(
				{
					userId: userId,
					itemId: models.Item.ID_JACKPOD,
					status: models.Point.STATUS_VALID,
					expiredAt: date.setFullYear(date.getFullYear() + 1),
				},
				{ transaction: t },
			);
			await t.commit();

			const item = await models.Item.findOne({
				attributes: ["name"],
				where: { id: models.Item.ID_JACKPOD },
			});
			return `${item.name}が当たったよ👕！っ`;
		}
		userItem = await models.UserItem.create(
			{
				userId: userId,
				itemId: models.Item.ID_HIT,
				status: models.Point.STATUS_VALID,
				expiredAt: date.setFullYear(date.getFullYear() + 1),
			},
			{ transaction: t },
		);
		await t.commit();

		const item = await models.Item.findOne({
			attributes: ["name"],
			where: { id: models.Item.ID_HIT },
		});
		return `${item.name}が当たったよ🍭！っ`;
	} catch (e) {
		console.error("Error:", e);
		await t.rollback();
		return "エラーが起こったよ！っ";
	}
};
