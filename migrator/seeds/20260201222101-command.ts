import type { Seed } from "@/migrator/umzug";
import { Actions } from "@/src/entities/constants/Commands";
import { SeederCommandModel } from "./models/SeederCommandModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederCommandModel]);
	await new SeederCommandModel().bulkUpsert(
		Actions.Commands.map((cmd) => ({
			commandCategoryType: cmd.commandCategoryType,
			commandType: cmd.commandType,
			name: cmd.name,
		})),
	);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"Commands",
		Actions.Commands.map((cmd) => ({
			commandCategoryType: cmd.commandCategoryType,
			commandType: cmd.commandType,
		})),
	);
};
