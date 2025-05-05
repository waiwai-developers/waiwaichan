import type { Datafix } from "@/migrator/umzug";
import { DatafixThreadModel } from "./models/DatafixThreadModel";
import { DatafixPersonalityModel } from "./models/DatafixPersonalityModel";
import { DatafixPersonalityCategoryModel } from "./models/DatafixPersonalityCategoryModel";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { Transaction } from "sequelize";

export const up: Datafix = async ({ context: sequelize }) => {
	// トランザクションを開始
	return sequelize.transaction(async (transaction: Transaction) => {
		try {
			const personality = await DatafixPersonalityModel.findOne(
				{
					where: {
						id: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
					},
					transaction
				}
			);
			if (!personality) {
				throw new Error("Personality not found. Rolling back transaction.");
			}

			const personalityCategory = await DatafixPersonalityCategoryModel.findOne(
				{
					where: {
						id: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
					},
					transaction
				}
			);
			if (!personalityCategory) {
				throw new Error("PersonalityCategory not found. Rolling back transaction.");
			}

			const metadata = Object.assign(personality.personality, personalityCategory.context);
			const threads = await DatafixThreadModel.findAll(
				{
					where: {
						categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
					},
					transaction
				}
			);

			for (const thread of threads) {
				await thread.update({
					metadata: metadata
				}, { transaction });
			}
		} catch (error) {
			console.error("Error during transaction:", error);
			throw error;
		}
	});
};
