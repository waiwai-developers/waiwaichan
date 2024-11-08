import models from '../models/index.js'
import Sequelize from 'sequelize';

export const pointItem = async (userId) => {
    try {
		const date = new Date()
        const userItems = await models.UserItem.findAll(
            { include: { model: models.Item, as: 'item' }},
            {
                where: {
                    userId: userId,
                    status: models.UserItem.STATUS_VALID,
                    expiredAt: {[Sequelize.Op.gte]: date}
                }
            }
        );

		const texts = userItems.map((u) =>
			[
				`- id: ${u.dataValues.id}`,
				`  - ${u.dataValues.item.name}`,
                `  - ${u.dataValues.item.description}`
			].join("\n"),
		);

        if (texts.length === 0) return "アイテムは持ってないよ！っ"

		return ( "以下のアイテムが交換できるよ！っ" + "\n" + texts.join("\n"));
    } catch (e) {
        console.error("Error:", e);
		return ("エラーが起こったよ！っ");
    }
};
