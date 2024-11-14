import Sequelize from "sequelize";
import { Item, UserItem } from "../models/index.js";

export const pointChange = async (userId, userItemId) => {
	try {
		const date = new Date();
		const userItem = await UserItem.findOne({
			include: { model: Item, as: "item" },
			where: {
				id: userItemId,
				userId: userId,
				status: UserItem.STATUS_VALID,
				expiredAt: { [Sequelize.Op.gte]: date },
			},
		});
		if (!userItem) return "アイテムは持ってないよ！っ";
		const itemName = userItem.dataValues.item.dataValues.name;
		await userItem.update({ status: UserItem.STATUS_INVALID });
		return `${itemName}と交換したよ！っ`;
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
