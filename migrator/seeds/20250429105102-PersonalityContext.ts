import { PersonalityContextsConst } from "@/src/entities/constants/PersonalityContexts";
import type { Seed } from "@/migrator/umzug";
import { MigratePersonalityContextModel } from "./models/MigratePersonalityContextModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([MigratePersonalityContextModel]);
	await new MigratePersonalityContextModel().bulkUpsert(PersonalityContextsConst.personalityContexts.map((pc) => (
		{
			"personalityId": pc.personalityId,
			"contextId": pc.contextId,
		}
	)));
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PersonalityContexts",
		PersonalityContextsConst.personalityContexts.map((pc) => ({
			personalityId: pc.personalityId,
			contextId: pc.contextId

		}))
	)
};
