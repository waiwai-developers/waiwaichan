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
	ChannelType as DiscordChannelType,
	type GuildChannel,
} from "discord.js";
import { inject, injectable } from "inversify";

/**
 * DiscordのChannelTypeをアプリケーションのChannelTypeに変換する
 * @param discordChannelType discord.jsのChannelType
 * @returns アプリケーションのChannelType
 */
const getChannelType = (
	discordChannelType: DiscordChannelType,
): ChannelType => {
	switch (discordChannelType) {
		case DiscordChannelType.DM:
			return ChannelType.DiscordDM;
		case DiscordChannelType.GuildText:
			return ChannelType.DiscordText;
		case DiscordChannelType.GuildVoice:
			return ChannelType.DiscordVoice;
		case DiscordChannelType.GroupDM:
			return ChannelType.DiscordGroupDM;
		case DiscordChannelType.GuildCategory:
			return ChannelType.DiscordCategory;
		case DiscordChannelType.GuildAnnouncement:
			return ChannelType.DiscordAnnouncement;
		case DiscordChannelType.AnnouncementThread:
			return ChannelType.DiscordAnnouncementThread;
		case DiscordChannelType.PublicThread:
			return ChannelType.DiscordPublicThread;
		case DiscordChannelType.PrivateThread:
			return ChannelType.DiscordPrivateThread;
		case DiscordChannelType.GuildStageVoice:
			return ChannelType.DiscordStageVoice;
		case DiscordChannelType.GuildForum:
			return ChannelType.DiscordForum;
		case DiscordChannelType.GuildMedia:
			return ChannelType.DiscordMedia;
		default:
			return ChannelType.DiscordOther;
	}
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
