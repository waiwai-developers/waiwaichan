import type { Datafix } from "@/migrator/umzug";
import { DatafixCandyModel } from "./models/DatafixCandyModel";
import { AppConfig } from "@/src/entities/config/AppConfig";

export const up: Datafix = async () => {
	const candies = await DatafixCandyModel.findAll(
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