import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICandyNotificationChannelLogic } from "@/src/logics/Interfaces/logics/ICandyNotificationChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyNotificationChannelDeleteCommandHandler
	implements SlashCommandHandler
{
	@inject(LogicTypes.CandyNotificationChannelLogic)
	private candyNotificationChannelLogic!: ICandyNotificationChannelLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "candynotificationchanneldelete";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		if (interaction.channel == null) {
			return;
		}
		// NOTE: todo CommunityとUserの追加を行ったあとにrbacを実現する
		if (
			RoleConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			interaction.reply(
				"キャンディ通知チャンネルを登録する権限を持っていないよ！っ",
			);
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		const candyNotificationChannel =
			await this.candyNotificationChannelLogic.find(communityId);
		if (candyNotificationChannel === undefined) {
			await interaction.reply(
				"キャンディ通知チャンネルが登録されていなかったよ！っ",
			);
			return;
		}

		await interaction.reply(
			await this.candyNotificationChannelLogic.delete(communityId),
		);
	}
}
