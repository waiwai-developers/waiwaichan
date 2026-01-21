import type { Datafix } from "@/migrator/umzug";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { DatafixCandyModel } from "./models/DatafixCandyModel";
import { DatafixUserModel } from "./models/DatafixUserModel";

export const up: Datafix = async () => {
	try {
		const candies = await DatafixCandyModel.findAll();
		for (const c of candies) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: c.userId,
					communityId: 1,
					deletedAt: null,
				},
			});
			if (user == null) {
				continue;
			}
			const giveUser = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: c.giveUserId,
					communityId: 1,
					deletedAt: null,
				},
			});
			if (giveUser == null) {
				continue;
			}
			await DatafixCandyModel.update(
				{
					userId: user.id,
					giveUserId: giveUser.id,
				},
				{
					where: {
						id: c.id,
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
