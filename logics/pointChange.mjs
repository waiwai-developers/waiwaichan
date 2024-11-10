//modelsをインポート
//sequelizeをインポート
import { UserItem } from '../models/index.js'
import Sequelize from 'sequelize'

export const pointChange = async (userId, userItemId) => {
	try {
		//DBから指定のuserItemを1件取得
		   //statusが0
		   //expiredAtが現在時刻より先
		   //userIdが引数のuserId
		   //itemIdが引数のitemId
		const date = new Date()
		const userItem = await UserItem.findOne(
			{
				where: {
					id: userItemId,
					userId: userId,
					status: UserItem.STATUS_VALID,
					expiredAt: {[Sequelize.Op.gte]: date}
				}
			}
		)

		//userItemが取れなかった場合に”アイテムは持ってないよ！っ"を返す
		if(!userItem) return "アイテムは持ってないよ！っ";
		//userItemのstatusを0から1に更新する
		await userItem.update({ status: UserItem.STATUS_INVALID});
		return "アイテムと交換したよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};
