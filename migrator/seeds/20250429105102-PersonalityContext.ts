import type { Seed } from "@/migrator/umzug";
import { PersonalityContextsConst } from "@/src/entities/constants/PersonalityContexts";
import { SeederPersonalityContextModel } from "./models/SeederPersonalityContextModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederPersonalityContextModel]);
	await new SeederPersonalityContextModel().bulkUpsert(
		PersonalityContextsConst.personalityContexts.map((pc) => ({
			personalityId: pc.personalityId,
			contextId: pc.contextId,
		})),
	);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PersonalityContexts",
		PersonalityContextsConst.personalityContexts.map((pc) => ({
			personalityId: pc.personalityId,
			contextId: pc.contextId,
		})),
	);
};
