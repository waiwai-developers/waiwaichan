import type { Datafix } from "@/migrator/umzug";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { DatafixReminderModel } from "./models/DatafixReminderModel";
import { DatafixUserModel } from "./models/DatafixUserModel";

export const up: Datafix = async () => {
	try {
		const reminders = await DatafixReminderModel.findAll();
		for (const r of reminders) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: r.userId,
					communityId: 1,
					deletedAt: null,
				},
			});
			if (user == null) {
				continue;
			}
			await DatafixReminderModel.update(
				{
					userId: user.id,
				},
				{
					where: {
						id: r.id,
					},
				},
			);
		}
	} catch (error: unknown) {
		console.error(
			`migration failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
};
