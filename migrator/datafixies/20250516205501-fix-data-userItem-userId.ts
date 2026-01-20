import type { Datafix } from "@/migrator/umzug";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";
import { DatafixUserModel } from "./models/DatafixUserModel";

export const up: Datafix = async () => {
	try {
		const userItems = await DatafixUserItemModel.findAll();
		for (const ui of userItems) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: ui.userId,
					communityId: 1,
					deletedAt: null,
				},
			});
			if (user == null) {
				continue;
			}
			await DatafixUserItemModel.update(
				{
					userId: user.id,
				},
				{
					where: {
						id: ui.id,
					},
				},
			);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`migration failed: ${message}`);
		throw error;
	}
};
