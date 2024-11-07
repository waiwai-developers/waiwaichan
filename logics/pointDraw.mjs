import models from '../models/index.js'
import Sequelize from 'sequelize';

export const pointDraw = async (userId) => {
    const t = await Sequelize.Transaction();
    try {
		const date = new Date()
        await models.Point.update(
            { status: models.Point.STATUS_INVALID },
            {
                where: {
                    receiveUserId: userId,
                    status: models.Point.STATUS_VALID,
                    expiredAt: {[Sequelize.Op.gte]: date.setMonth(date.getMonth() -1)}
    			},
    			order: [['expiredAt', 'ASC']],
    			limit: 1
            },
            { transaction: t }
        );

        const probabilityNum = 100
        const randomNum = Math.floor(Math.random() * probabilityNum + 1)

        if (randomNum % 10 !== 0) {
            await t.commit();
            return "ハズレちゃったよ！っ";
        }

        let userItem = null
        if (randomNum  % 100 === 0){
            userItem = await models.UserItem.create(
                {
                    userId: userId,
                    itemId: 1,
                    status: models.Point.STATUS_VALID,
                    expiredAt: dayjs(datetime).subtract(1, 'y').format('YYYY-MM-DD HH:mm:ss')
                },
                { transaction: t }
            );
            await t.commit();
            return `${userItem.name}が当たったよ👕！っ`;
        } else if (randomNum  % 10 === 0) {
            userItem = await models.UserItem.create(
                {
                    userId: userId,
                    itemId: 2,
                    status: models.Point.STATUS_VALID,
                    expiredAt: dayjs(datetime).subtract(1, 'y').format('YYYY-MM-DD HH:mm:ss')
                },
                { transaction: t }
            );
            await t.commit();
            return `${userItem.name}が当たったよ🍭！っ`;
        }
    } catch (e) {
        console.error("Error:", e);
        await t.rollback();
		return ("エラーが起こったよ！っ");
    }
};
