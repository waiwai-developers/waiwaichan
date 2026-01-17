import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, GuildMember } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionAddUserRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(HandlerTypes.ActionAddUserHandler)
	private readonly handler!: DiscordEventHandler<GuildMember>;
	register(client: Client): void {
		client.on("guildMemberAdd", async (member) => {
			try {
				this.logger.info(
					`User is added to new server for guildIs: ${member.guild.id} memberId: ${member.id}.`,
				);
				await this.handler.handle(member);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
