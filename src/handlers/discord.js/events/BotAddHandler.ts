import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { ChannelType as DiscordChannelType, type Guild } from "discord.js";
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
export class BotAddHandler implements DiscordEventHandler<Guild> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	@inject(LogicTypes.ChannelLogic)
	private readonly ChannelLogic!: IChannelLogic;

	async handle(guild: Guild): Promise<void> {
		try {
			this.logger.info(
				`BotAddHandler: Bot was added to guild, guildId: ${guild.id}`,
			);
			const communityId = await this.CommunityLogic.create(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(guild.id)),
				),
			);
			if (communityId == null) {
				return;
			}

			const members = await guild.members.fetch();
			await this.UserLogic.bulkCreate(
				members.map(
					(m) =>
						new UserDto(
							UserCategoryType.Discord,
							new UserClientId(BigInt(m.id)),
							m.user.bot ? UserType.bot : UserType.user,
							new UserCommunityId(communityId.getValue()),
						),
				),
			);

			const channels = await guild.channels.fetch();
			const channelDtos = channels
				.filter((c) => c !== null)
				.map((c) => {
					const channelType = getChannelType(c?.type);
					return new ChannelDto(
						ChannelCategoryType.Discord,
						new ChannelClientId(BigInt(c?.id)),
						channelType,
						new ChannelCommunityId(communityId.getValue()),
					);
				});

			if (channelDtos.length > 0) {
				await this.ChannelLogic.bulkCreate(channelDtos);
			}
		} catch (error) {
			this.logger.error(`BotAddHandler error: ${error}`);
		}
	}
}
