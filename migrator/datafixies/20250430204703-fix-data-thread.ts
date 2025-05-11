import type { Datafix } from "@/migrator/umzug";
import { DatafixThreadModel } from "./models/DatafixThreadModel";
import { DatafixPersonalityModel } from "./models/DatafixPersonalityModel";
import { DatafixContextModel } from "./models/DatafixContextModel";
import { DatafixPersonalityContextModel } from "./models/DatafixPersonalityContextModel";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { Transaction } from "sequelize";
import { ContextsConst } from "@/src/entities/constants/Contexts";
import { PersonalitiesConst } from "@/src/entities/constants/Personalities";

export const up: Datafix = async ({ context: sequelize }) => {
	// トランザクションを開始
	return sequelize.transaction(async (transaction: Transaction) => {
		try {
			const personality = await DatafixPersonalityModel.findOne(
				{
					where: {
						id: PersonalitiesConst.personalities.find((c) => c.name === "waiwaichan")?.id,
					},
					transaction
				}
			);
			if (!personality) {
				throw new Error("Personality not found. Rolling back transaction.");
			}

			const personalityContext = await DatafixPersonalityContextModel.findOne(
				{
					where: {
						personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
						categoryId: ContextsConst.contexts.find((c) => c.name === "カテゴリなし")?.id,
					},
					transaction
				}
			);
			if (!personalityContext) {
				throw new Error("PersonalityContext not found. Rolling back transaction.");
			}

			const context = await DatafixContextModel.findOne(
				{
					where: {
						id: personalityContext.categoryId,
					},
					transaction
				}
			);
			if (!context) {
				throw new Error("PersonalityCategory not found. Rolling back transaction.");
			}

			const metadata = Object.assign(personality.prompt, context.prompt);
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
