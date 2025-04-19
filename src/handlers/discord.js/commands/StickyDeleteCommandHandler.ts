import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyDeleteCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;
	isHandle(commandName: string): boolean {
		return commandName === "stickydelete";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (interaction.channel == null) {
			return;
		}
		if (
			AccountsConfig.users.map((u) => u.role).includes(interaction.user.id)
		) {
			interaction.reply("スティッキーを登録する権限を持っていないよ！っ");
			return;
		}

		const sticky = await this.stickyLogic.find(
			new DiscordGuildId(interaction.guildId),
			new DiscordMessageId(interaction.options.getString("channelid", true)),
		);
		if (sticky === undefined) {
			await interaction.reply("スティッキーが登録されていなかったよ！っ");
			return;
		}
		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (channel === undefined) {
			await interaction.reply("スティッキーの投稿がなかったよ！っ");
			return;
		}

		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルのスティッキーを削除できないよ！っ",
			);
			return;
		}

		const message = await channel.messages.fetch(sticky.messageId.getValue());
		await message.delete();

		await interaction.deferReply();
		await interaction.editReply(
			await this.stickyLogic.delete(
				new DiscordGuildId(interaction.guildId),
				new DiscordMessageId(interaction.options.getString("channelid", true)),
			),
		);
	}
}
