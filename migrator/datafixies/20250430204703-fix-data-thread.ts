import type { Datafix } from "@/migrator/umzug";
import { DatafixThreadModel } from "./models/DatafixThreadModel";
import { DatafixPersonalityModel } from "./models/DatafixPersonalityModel";
import { DatafixPersonalityCategoryModel } from "./models/DatafixPersonalityCategoryModel";
import  { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { Transaction } from "sequelize";

export const up: Datafix = async ({ context: sequelize }) => {
	// トランザクションを開始
	return sequelize.transaction(async (transaction: Transaction) => {
		try {
			const personality = await DatafixPersonalityModel.findOne(
				{
					where: {
						// ここマジックナンバーになるかもなので後で直す
						id: 1,
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
						// ここマジックナンバーになるかもなので後で直す
						id: 1,
					},
					transaction
				}
			);
			if (!personalityCategory) {
				throw new Error("PersonalityCategory not found. Rolling back transaction.");
			}

			const mergedObj = Object.assign(personality.personality, personalityCategory.context);
			const threads = await DatafixThreadModel.findAll(
				{
					where: {
						categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
					},
					transaction
				}
			);

			for (const thread of threads) {
				await thread.update({
					metadata: mergedObj
				}, { transaction });
			}
		} catch (error) {
			console.error("Error during transaction:", error);
			throw error;
		}
	});
};
