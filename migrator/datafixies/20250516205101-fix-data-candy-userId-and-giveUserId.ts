import type { Datafix } from "@/migrator/umzug";
import { DatafixCandyModel } from "./models/DatafixCandyModel";
import { DatafixUserModel } from "./models/DatafixUserModel";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";

export const up: Datafix = async () => {
	try {
		const candies = await DatafixCandyModel.findAll()
		for (const c of candies) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: c.userId,
					communityId: 1,
					deletedAt: null
				}
			})
			if ( user == null) { continue; }
			const giveUser = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: c.giveUserId,
					communityId: 1,
					deletedAt: null
				}
			})
			if ( giveUser == null) { continue; }
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
			)
		}
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};
