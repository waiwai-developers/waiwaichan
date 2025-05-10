import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Guild } from "discord.js";
import { inject, injectable, multiInject } from "inversify";

@injectable()
export class ActionAddBotRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@multiInject(HandlerTypes.ActionAddBotHandler)
	private readonly handler!: DiscordEventHandler<Guild>;
	register(client: Client): void {
		client.on("guildCreate", async (guild) => {
			try {
				this.logger.info(
					`Bot is added to new server for guildIs: ${guild.id}.`,
				);
				await this.handler.handle(guild)
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
