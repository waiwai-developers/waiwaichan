import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import {
	type GuildChannel,
	ChannelType as DiscordChannelType,
} from "discord.js";
import { inject, injectable } from "inversify";

/**
 * DiscordのChannelTypeをアプリケーションのChannelTypeに変換する
 * @param discordChannelType discord.jsのChannelType
 * @returns アプリケーションのChannelType（0: その他、1: テキストチャンネル、2: ボイスチャンネル）
 */
const getChannelType = (discordChannelType: DiscordChannelType): ChannelType => {
	// テキストチャンネル（GuildText = 0）
	if (discordChannelType === DiscordChannelType.GuildText) {
		return ChannelType.Text;
	}
	// ボイスチャンネル（GuildVoice = 2）
	if (discordChannelType === DiscordChannelType.GuildVoice) {
		return ChannelType.Voice;
	}
	// その他のチャンネルタイプ
	return ChannelType.Other;
};

@injectable()
export class ChannelCreateHandler implements DiscordEventHandler<GuildChannel> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.ChannelLogic)
	private readonly ChannelLogic!: IChannelLogic;

	async handle(channel: GuildChannel): Promise<void> {
		try {
			this.logger.info(
				`ChannelCreateHandler: Channel was created, guildId: ${channel.guild.id}, channelId: ${channel.id}`,
			);

			const channelType = getChannelType(channel.type);

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(channel.guild.id)),
				),
			);
			if (communityId == null) {
				return;
			}

			const isBulkCreate = await this.ChannelLogic.bulkCreate([
				new ChannelDto(
					ChannelCategoryType.Discord,
					new ChannelClientId(BigInt(channel.id)),
					channelType,
					new ChannelCommunityId(communityId.getValue()),
				),
			]);
			if (!isBulkCreate) {
				return;
			}
		} catch (error) {
			this.logger.error(`ChannelCreateHandler error: ${error}`);
		}
	}
}
