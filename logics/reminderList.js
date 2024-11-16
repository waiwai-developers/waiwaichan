import dayjs from "dayjs";
import { Reminder } from "../repositories/sequelize-mysql/index.js";

export const reminderList = async (userId) => {
	try {
		const reminders = await Reminder.findAll({
			where: { userId: userId },
		});

		const texts = reminders.map((r) =>
			[
				`- id: ${r.dataValues.id}`,
				`  - ${dayjs(r.dataValues.remindAt.toLocaleString()).add(9, "h").format("YYYY-MM-DD HH:mm:ss")}`,
				`  - ${r.dataValues.message}`,
			].join("\n"),
		);

		if (texts.length === 0) return "リマインドは予約されていないよ！っ";

		return `以下のリマインドが予約されているよ！っ\n${texts.join("\n")}`;
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
