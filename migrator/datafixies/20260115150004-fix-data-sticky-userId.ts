import type { Datafix } from "@/migrator/umzug";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { DatafixStickyModel } from "./models/DatafixStickyModel";
import { DatafixUserModel } from "./models/DatafixUserModel";

export const up: Datafix = async () => {
	try {
		const sticky = await DatafixStickyModel.findAll();
		for (const s of sticky) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: s.userId,
					communityId: 1,
					deletedAt: null,
				},
			});
			if (user == null) {
				continue;
			}
			await DatafixStickyModel.update(
				{
					userId: user.id,
				},
				{
					where: {
						id: s.id,
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
