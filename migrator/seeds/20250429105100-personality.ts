import { PersonalitiesConst } from "@/src/entities/constants/personality";
import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { MigratePersonalityModel } from "./models/MigratePersonalityModel";
export const PERSONALITY_RECORDS = [PersonalitiesConst];

export const up: Seed = async ({ context: sequelize }) => {
	sequelize.addModels([MigratePersonalityModel]);
	await new MigratePersonalityModel().bulkUpsert(
		PersonalitiesConst.personalities.map((p) => (
			{
				"id": p.id,
				"name": p.name,
				"personality": JSON.parse(`{"persona_role": ${p.personality.persona_role}, "speaking_style_rules": ${p.personality.speaking_style_rules}, "response_directives": ${p.personality.response_directives}, "emotion_model": ${p.personality.emotion_model}, "notes": ${p.personality.notes}}`)
			}
		)
	));
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"Personalities",
		{
			id: { [Op.in]: PersonalitiesConst.personalities.map((r) => r.id) },
		},
		{},
	);
};
