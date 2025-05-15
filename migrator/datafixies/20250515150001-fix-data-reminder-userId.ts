import type { Datafix } from "@/migrator/umzug";
import { DatafixReminderModel } from "./models/DatafixReminderModel";
import { DatafixUserModel } from "./models/DatafixUserModel";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";

export const up: Datafix = async () => {
	try {
		const reminders = await DatafixReminderModel.findAll()
		for (const r of reminders) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: r.userId,
					communityId: 1
				}
			})
			if ( user == null) { continue; }
			await DatafixReminderModel.update(
				{
					userId: user.id,
				},
				{
					where: {
						id: r.id,
					},
				},
			)
		}
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};
