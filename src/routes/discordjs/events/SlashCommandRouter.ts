import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";
import { inject, injectable, multiInject } from "inversify";

@injectable()
export class SlashCommandRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@multiInject(HandlerTypes.SlashCommandHandler)
	private readonly handlers!: SlashCommandHandler[];
	register(client: Client<boolean>): void {
		client.on("interactionCreate", async (interaction) => {
			try {
				if (!interaction.isChatInputCommand()) return;
				const matched = this.handlers.find((h) =>
					h.isHandle(interaction.commandName),
				);
				if (matched == null) {
					this.logger.error(`No Such Command /${interaction.commandName}`);
					await interaction.reply("そんなコマンドはないよ！っ");
					return;
				}
				await matched.handle(interaction);
			} catch (error) {
				this.logger.error(`Error: ${error}`);
				if (interaction.isChatInputCommand()) {
					if (interaction.replied || interaction.deferred) {
						interaction.editReply(InternalErrorMessage);
					} else {
						interaction.reply(InternalErrorMessage);
					}
				}
			}
		});
	}
}
