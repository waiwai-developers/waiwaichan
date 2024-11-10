import Sequelize from "sequelize";
//modelsをインポート
//sequelizeをインポート
import { UserItem } from "../models/index.js";

export const pointChange = async (userId, userItemId) => {
	try {
		//DBから指定のuserItemを1件取得
		//statusが0
		//expiredAtが現在時刻より先
		//userIdが引数のuserId
		//itemIdが引数のitemId
		const date = new Date();
		//userItemのstatusを0から1に更新する
		const userItem = await UserItem.update(
			{ status: UserItem.STATUS_INVALID },
			{
			where: {
				id: userItemId,
				userId: userId,
				status: UserItem.STATUS_VALID,
				expiredAt: { [Sequelize.Op.gte]: date },
			},
			limit: 1,
		});

		//userItemが取れなかった場合に”アイテムは持ってないよ！っ"を返す
		if (userItem[0] > 0) return "アイテムと交換したよ！っ";
		return "アイテム持ってないよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
