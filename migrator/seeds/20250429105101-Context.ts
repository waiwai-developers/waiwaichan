import { ContextsConst } from "@/src/entities/constants/Contexts";
import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { SeederContextModel } from "./models/SeederContextModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederContextModel]);
	await new SeederContextModel().bulkUpsert(ContextsConst.contexts.map((c) => (
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
