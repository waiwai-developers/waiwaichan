import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, GuildChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionAddChannelRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(HandlerTypes.ActionAddChannelHandler)
	private readonly handler!: DiscordEventHandler<GuildChannel>;
	register(client: Client): void {
		client.on("channelCreate", async (channel) => {
			try {
				if (channel.isDMBased()) {
					return;
				}
				this.logger.info(
					`Channel is created for guildId: ${channel.guild.id} channelId: ${channel.id}.`,
				);
				await this.handler.handle(channel);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
