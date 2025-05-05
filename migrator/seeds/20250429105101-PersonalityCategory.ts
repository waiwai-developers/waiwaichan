import { CategoriesConst } from "@/src/entities/constants/personalityCategory";
import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { MigratePersonalityCategoryModel } from "./models/MigratePersonalityCategoryModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([MigratePersonalityCategoryModel]);
	await new MigratePersonalityCategoryModel().bulkUpsert(CategoriesConst.categories.map((c) => (
		{
			"id": c.id,
			"personalityId": c.personalityId,
			"name": c.name,
			"context": JSON.parse(c.input_scope)
		}
	)));
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PersonalityCategories",
		{
			id: { [Op.in]: CategoriesConst.categories.map((r) => r.id) },
		},
		{},
	);
};
