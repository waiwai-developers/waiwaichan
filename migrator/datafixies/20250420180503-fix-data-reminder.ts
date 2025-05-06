import type { Datafix } from "@/migrator/umzug";
import { DatafixReminderModel } from "./models/DatafixReminderModel";
import { AppConfig } from "@/src/entities/config/AppConfig";

export const up: Datafix = async () => {
	const candies = await DatafixReminderModel.findAll(
        {
			where: {
				guildId: null,
			},
		}
	);
	await Promise.all(
		candies.map(async (t) => {
			t.update({
				guildId: AppConfig.discord.guildId,
		    })
        })
    )
};
