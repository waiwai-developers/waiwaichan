import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Guild } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class BotAddRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(HandlerTypes.BotAddHandler)
	private readonly handler!: DiscordEventHandler<Guild>;
	register(client: Client): void {
		client.on("guildCreate", async (guild) => {
			try {
				this.logger.info(
					`Bot is added to new server for guildIs: ${guild.id}.`,
				);
				await this.handler.handle(guild);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
