import models from '../models/index.js'

export const reminderDelete = async (id, userId) => {
	try {
        await models.Reminder.destroy({
            where: {
                id: id,
                userId: userId
			}
        });
		return "リマインドの予約を削除したよ！っ";
	} catch (e) {
		console.error("Error:", e);
	}
};
