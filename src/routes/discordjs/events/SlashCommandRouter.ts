import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { HandlerTypes } from "@/src/entities/constants/DIContainerTypes";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";
import { injectable, multiInject } from "inversify";

@injectable()
export class SlashCommandRouter implements DiscordEventRouter {
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
					await interaction.reply("そんなコマンドはないよ！っ");
					return;
				}
				await matched.handle(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.isChatInputCommand()) {
					interaction.reply(InternalErrorMessage);
				}
			}
		});
	}
}
