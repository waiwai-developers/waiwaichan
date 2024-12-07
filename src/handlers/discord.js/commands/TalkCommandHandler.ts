import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type {
	CacheType,
	ChatInputCommandInteraction,
	TextChannel,
} from "discord.js";
import { injectable } from "inversify";

@injectable()
export class TalkCommandHandler implements SlashCommandHandler {
	isHandle(commandName: string): boolean {
		return commandName === "talk";
	}

	isTextChannel(channel: unknown): channel is TextChannel {
		return (
			(channel as TextChannel).threads != null &&
			(channel as TextChannel).threads.create != null
		);
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (interaction.channel == null) {
			return;
		}
		if (!this.isTextChannel(interaction.channel)) {
			return;
		}

		const title = interaction.options.getString("title", true);

		await interaction
			.reply({
				content: "以下にお話する場を用意したよ！っ",
				fetchReply: true,
			})
			.then((reply) => {
				reply.startThread({
					name: title,
					autoArchiveDuration: 60,
				});
			});
	}
}
