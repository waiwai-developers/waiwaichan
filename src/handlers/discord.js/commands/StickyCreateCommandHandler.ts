import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { StickyDto } from "@/src/entities/dto/StickyDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyCreateCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;
	isHandle(commandName: string): boolean {
		return commandName === "stickycreate";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (interaction.channel == null) {
			return;
		}

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);

		if (!(channel instanceof TextChannel)) {
			return;
		}
		const message = await channel.send(
			interaction.options.getString("message", true),
		);

		await interaction.deferReply();
		await interaction.editReply(
			await this.stickyLogic.create(
				new StickyDto(
					new DiscordGuildId(interaction.guildId),
					new DiscordChannelId(
						interaction.options.getString("channelid", true),
					),
					new DiscordUserId(interaction.user.id),
					new DiscordMessageId(message.id),
					new StickyMessage(interaction.options.getString("message", true)),
				),
			),
		);
	}
}
