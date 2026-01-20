import type { Datafix } from "@/migrator/umzug";
import { DatafixStickyModel } from "./models/DatafixStickyModel";
import { DatafixUserModel } from "./models/DatafixUserModel";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";

export const up: Datafix = async () => {
	try {
		const sticky = await DatafixStickyModel.findAll()
		for (const s of sticky) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: s.userId,
					communityId: 1,
					deletedAt: null
				}
			})
			if ( user == null) { continue; }
			await DatafixStickyModel.update(
				{
					userId: user.id,
				},
				{
					where: {
						id: s.id,
					},
				},
			)
		}
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};
