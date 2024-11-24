import { HandlerTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { SlashCommandHandler } from "@/src/routes/discordjs/handler/SlashCommandHandler";
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
				if (!matched) {
					await interaction.reply("そんなコマンドはないよ！っ");
					return;
				}
				await matched.handle(interaction);
			} catch (error) {
				console.log(error);
			}
		});
	}
}
