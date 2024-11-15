import dayjs from "dayjs";
import moment from "moment";
import { Reminder } from "../models/index.js";

export const reminderSet = async (channelId, userId, message, datetime) => {
	try {
		const remindAt = dayjs(datetime)
			.subtract(9, "h")
			.format("YYYY-MM-DD HH:mm:ss");
		const datenow = moment().format("YYYY-MM-DD HH:mm:ss");

		if (remindAt <= datenow)
			return "過去の日付のリマインドは設定できないよ！っ";

		await Reminder.create({
			channelId: channelId,
			userId: userId,
			message: message,
			remindAt: remindAt,
		});
		return "リマインドの投稿を予約したよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
