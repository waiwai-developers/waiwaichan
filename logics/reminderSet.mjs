import models from '../models/index.js'
import dayjs from 'dayjs';

export const reminderSet = async (channelId, userId, message, datetime) => {
	try {
		await models.Reminder.create({
			channelId: channelId,
			userId: userId,
			message: message,
			remindAt: dayjs(datetime).subtract(9, 'h').format('YYYY-MM-DD HH:mm:ss')
		});
		return "リマインドの投稿を予約したよ！っ";
	} catch (e) {
		console.error("Error:", e);
	}
};
