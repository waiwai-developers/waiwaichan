//modelsをインポート
//sequelizeをインポート
import models from '../models/index.js'
import Sequelize from 'sequelize'

export const pointChange = async (userId, itemId) => {
	try {
		//DBから指定のuserItemを1件取得
		   //statusが0
		   //expiredAtが現在時刻より先
		   //userIdが引数のuserId
		   //itemIdが引数のitemId
		const date = new Date()
		const userItem = await models.UserItem.update(
			{status: models.UserItem.STATUS_INVALID},
			{
				where: {
					userId: userId,
					itemId: itemId,
					status: models.UserItem.STATUS_VALID,
					expiredAt: {[Sequelize.Op.gte]: date}
				}
			}
		)

		//userItemが取れなかった場合に”アイテムは持ってないよ！っ"を返す
		if(!userItem) return "アイテムは持ってないよ！っ";
		//userItemのstatusを0から1に更新する

		//userItemが取れた場合に”アイテムと交換したよ！っ"を返す
		return "アイテムと交換したよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};
