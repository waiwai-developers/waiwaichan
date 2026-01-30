import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CandyNotificationChannelDto } from "@/src/entities/dto/CandyNotificationChannelDto";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICandyNotificationChannelLogic } from "@/src/logics/Interfaces/logics/ICandyNotificationChannelLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyNotificationChannelCreateCommandHandler
	implements SlashCommandHandler
{
	@inject(LogicTypes.CandyNotificationChannelLogic)
	private candyNotificationChannelLogic!: ICandyNotificationChannelLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	isHandle(commandName: string): boolean {
		return commandName === "candynotificationchannelcreate";
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
			interaction.reply("キャンディ通知チャンネルを登録する権限を持っていないよ！っ");
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
		if (candyNotificationChannel !== undefined) {
			await interaction.reply("キャンディチャンネルが既に登録されているよ！っ");
			return;
		}

		const targetChannelId = interaction.options.getString("channelid", true);
		const channel = interaction.guild?.channels.cache.get(targetChannelId);
		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルはテキストチャンネルでないのでキャンディ通知チャンネルとして登録できないよ！っ",
			);
			return;
		}

		const channelId = await this.ChannelLogic.getIdByCommunityIdAndClientId(
			new ChannelCommunityId(communityId.getValue()),
			new ChannelClientId(BigInt(targetChannelId)),
		);
		if (channelId == null) {
			await interaction.reply("チャンネルが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			await this.candyNotificationChannelLogic.create(
				new CandyNotificationChannelDto(communityId, channelId),
			),
		);
	}
}
