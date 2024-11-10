import models from '../models/index.js'

export const reminderDelete = async (id, userId) => {
	try {
        const reminder = await models.Reminder.destroy({
            where: {
                id: id,
                userId: userId
			}
        });

		if(!reminder) return "リマインドの予約はされていなかったよ！っ";

		await reminder.destroy

		return "リマインドの予約を削除したよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return ("エラーが起こったよ！っ");
	}
};
