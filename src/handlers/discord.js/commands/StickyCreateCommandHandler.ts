import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { StickyDto } from "@/src/entities/dto/StickyDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
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
		if (
			AccountsConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			interaction.reply("スティッキーを登録する権限を持っていないよ！っ");
			return;
		}

		const sticky = await this.stickyLogic.find(
			new DiscordGuildId(interaction.guildId),
			new DiscordMessageId(interaction.options.getString("channelid", true)),
		);
		if (sticky !== undefined) {
			await interaction.reply(
				"スティッキーが既にチャンネルに登録されているよ！っ",
			);
			return;
		}

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルにはスティッキーを登録できないよ！っ",
			);
			return;
		}

		const message = await channel.send(
			interaction.options.getString("message", true),
		);
		if (!message) {
			await interaction.reply("スティッキーの投稿に失敗したよ！っ");
			return;
		}

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
				),
			),
		);
	}
}
