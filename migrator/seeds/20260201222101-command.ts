import type { Seed } from "@/migrator/umzug";
import { CommandsConst } from "@/src/entities/constants/Commands";
import { SeederCommandModel } from "./models/SeederCommandModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederCommandModel]);
	await new SeederCommandModel().bulkUpsert(
		CommandsConst.Commands.map((cmd) => ({
			commandCategoryType: cmd.commandCategoryType,
			commandType: cmd.commandType,
			name: cmd.name,
		})),
	);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"Commands",
		CommandsConst.Commands.map((cmd) => ({
			commandCategoryType: cmd.commandCategoryType,
			commandType: cmd.commandType,
		})),
	);
};
