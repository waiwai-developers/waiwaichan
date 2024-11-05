import models from '../models/index.js'

export const reminderSet = async (channelId, userId, message, datetime) => {
	try {
		await models.Reminder.create({
			channelId: channelId,
			userId: userId,
			message: message,
			remindAt: datetime
		});
		return "リマインドの投稿を予約したよ！っ";
	} catch (e) {
		console.error("Error:", e);
	}
};
