import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { TextChannel } from "discord.js";


import { inject, injectable } from "inversify";

@injectable()
export class StickyDeleteCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;
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
			RoleConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			interaction.reply("スティッキーを登録する権限を持っていないよ！っ");
			return;
		}

		if (!interaction.guildId) {
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId))
			)
		)
		if (communityId == null) {
			return;
		}

		const sticky = await this.stickyLogic.find(
			communityId,
			new DiscordChannelId(interaction.options.getString("channelid", true)),
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
		const success = await message.delete();
		if (!success) {
			await interaction.reply("スティッキーの削除に失敗したよ！っ");
			return;
		}

		await interaction.deferReply();
		await interaction.editReply(
			await this.stickyLogic.delete(
				communityId,
				new DiscordChannelId(interaction.options.getString("channelid", true)),
			),
		);
	}
}
