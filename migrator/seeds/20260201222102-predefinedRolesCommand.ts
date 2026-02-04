import type { Seed } from "@/migrator/umzug";
import { PersonalityContextsConst } from "@/src/entities/constants/PredefinedRolesCommands";
import { SeederPredefinedRolesActionModel } from "./models/SeederPredefinedRolesActionModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederPredefinedRolesActionModel]);
	await new SeederPredefinedRolesActionModel().bulkUpsert(
		PersonalityContextsConst.PredefinedRolesCommands.map((prc) => ({
			predefinedRolesId: prc.predefinedRolesId,
			commandCategoryType: prc.commandCategoryType,
			commandType: prc.commandType,
		})),
	);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PredefinedRoleCommand",
		PersonalityContextsConst.PredefinedRolesCommands.map((prc) => ({
			predefinedRolesId: prc.predefinedRolesId,
			commandCategoryType: prc.commandCategoryType,
			commandType: prc.commandType,
		})),
	);
};
