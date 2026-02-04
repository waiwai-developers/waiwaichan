import type { Seed } from "@/migrator/umzug";
import { PersonalityContextsConst } from "@/src/entities/constants/PredefinedRoles";
import { SeederPredefinedRoleModel } from "./models/SeederPredefinedRoleModel";

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([SeederPredefinedRoleModel]);
	await new SeederPredefinedRoleModel().bulkUpsert(
		PersonalityContextsConst.PredefinedRole.map((pr) => ({
			id: pr.id,
			name: pr.name,
		})),
	);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"PredefinedRoles",
		PersonalityContextsConst.PredefinedRole.map((pr) => ({
			id: pr.id,
		})),
	);
};
