import Sequelize from "sequelize";
import {
	Item,
	MysqlConnector,
	Point,
	UserItem,
} from "../repositories/sequelize-mysql/index.js";

export const pointDraw = async (userId) => {
	const t = await MysqlConnector.getInstance().transaction();
	try {
		const date = new Date();
		const point = await Point.findOne({
			where: {
				receiveUserId: userId,
				status: Point.STATUS_VALID,
				expiredAt: { [Sequelize.Op.gte]: date },
			},
			order: [["expiredAt", "ASC"]],
		});

		if (!point) return "ポイントがないよ！っ";

		await Point.update(
			{ status: Point.STATUS_INVALID },
			{ where: { id: point.id } },
			{ transaction: t },
		);

		// NOTE:todo より良い乱数生成に変える
		const randomNum = Math.floor(Math.random() * Item.PROBABILITY_JACKPOD + 1);

		if (randomNum % Item.PROBABILITY_HIT !== 0) {
			await t.commit();
			return "ハズレちゃったよ！っ";
		}

		let userItem = null;
		if (randomNum % Item.PROBABILITY_JACKPOD === 0) {
			userItem = await UserItem.create(
				{
					userId: userId,
					itemId: Item.ID_JACKPOD,
					status: Point.STATUS_VALID,
					expiredAt: date.setFullYear(date.getFullYear() + 1),
				},
				{ transaction: t },
			);
			await t.commit();

			const item = await Item.findOne({
				attributes: ["name"],
				where: { id: Item.ID_JACKPOD },
			});
			return `${item.name}が当たったよ👕！っ`;
		}
		userItem = await UserItem.create(
			{
				userId: userId,
				itemId: Item.ID_HIT,
				status: Point.STATUS_VALID,
				expiredAt: date.setFullYear(date.getFullYear() + 1),
			},
			{ transaction: t },
		);
		await t.commit();

		const item = await Item.findOne({
			attributes: ["name"],
			where: { id: Item.ID_HIT },
		});
		return `${item.name}が当たったよ🍭！っ`;
	} catch (e) {
		console.error("Error:", e);
		await t.rollback();
		return "エラーが起こったよ！っ";
	}
};
