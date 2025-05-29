import { ContextsConst } from "@/src/entities/constants/Contexts";
import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { MigrateContextModel } from "./models/MigrateContextModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([MigrateContextModel]);
	await new MigrateContextModel().bulkUpsert(ContextsConst.contexts.map((c) => (
		{
			"id": c.id,
			"name": c.name,
			"prompt": JSON.parse(`{"input_scope": ${c.input_scope}}`)
		}
	)));
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"Contexts",
		{
			id: { [Op.in]: ContextsConst.contexts.map((r) => r.id) },
		},
		{},
	);
};
