import models from '../models/index.js'
import dayjs from 'dayjs';

export const reminderList = async (userId) => {
    try {
        const reminders = await models.Reminder.findAll({
            where: {userId: userId}
        });

		const texts = reminders.map((r) =>
			[
				`- id: ${r.dataValues.id}`,
				`  - ${dayjs(r.dataValues.remindAt.toLocaleString()).format('YYYY-MM-DD HH:mm:ss')}`,
				`  - ${r.dataValues.message}`
			].join("\n"),
		);
		return ( "以下のリマインドが予約されているよ！っ" + "\n" + texts.join("\n"));
    } catch (e) {
        console.error("Error:", e);
    }
};
