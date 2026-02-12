import type { Seed } from "@/migrator/umzug";
import { PredefinedRolesCommandsConst } from "@/src/entities/constants/PredefinedRolesCommands";
import { SeederPredefinedRolesCommandModel } from "./models/SeederPredefinedRolesCommandModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederPredefinedRolesCommandModel]);
	await new SeederPredefinedRolesCommandModel().bulkUpsert(
		PredefinedRolesCommandsConst.PredefinedRolesCommands.map((prc) => ({
			predefinedRolesId: prc.predefinedRolesId,
			commandCategoryType: prc.commandCategoryType,
			commandType: prc.commandType,
			isAllow: prc.isAllow,
		})),
	);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PredefinedRoleCommand",
		PredefinedRolesCommandsConst.PredefinedRolesCommands.map((prc) => ({
			predefinedRolesId: prc.predefinedRolesId,
			commandCategoryType: prc.commandCategoryType,
			commandType: prc.commandType,
		})),
	);
};
