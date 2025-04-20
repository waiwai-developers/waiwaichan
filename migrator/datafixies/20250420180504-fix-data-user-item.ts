import type { Datafix } from "@/migrator/umzug";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";
import { AppConfig } from "@/src/entities/config/AppConfig";

export const up: Datafix = async () => {
	const candies = await DatafixUserItemModel.findAll(
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