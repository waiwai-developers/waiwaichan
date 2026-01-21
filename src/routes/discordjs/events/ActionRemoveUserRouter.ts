import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, GuildMember, PartialGuildMember } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionRemoveUserRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(HandlerTypes.ActionRemoveUserHandler)
	private readonly handler!: DiscordEventHandler<
		GuildMember | PartialGuildMember
	>;
	register(client: Client): void {
		client.on("guildMemberRemove", async (member) => {
			try {
				this.logger.info(
					`User was removed to new server for guildIs: ${member.guild.id} memberId: ${member.id}.`,
				);
				await this.handler.handle(member);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
