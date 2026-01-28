import { AppConfig } from "@/src/entities/config/AppConfig";
import { APPLY_CROWN_NUM } from "@/src/entities/constants/Crown";
import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { MessageDto } from "@/src/entities/dto/MessageDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CrownMessage } from "@/src/entities/vo/CrownMessage";
import { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import { MessageCategoryType } from "@/src/entities/vo/MessageCategoryType";
import { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CrownReactionHandler
	implements DiscordEventHandler<ReactionInteraction>
{
	@inject(LogicTypes.CrownLogic)
	private crownLogic!: ICrownLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	@inject(LogicTypes.MessageLogic)
	private MessageLogic!: IMessageLogic;

	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	async handle({ reaction, user }: ReactionInteraction): Promise<void> {
		if (reaction.partial) {
			try {
				await reaction.fetch();
				await reaction.message.fetch();
				await reaction.message.guild?.channels.fetch();
			} catch (err) {
				this.logger.error("fail to fetch old message");
				return;
			}
		}
		if (user.bot) {
			this.logger.debug("reaction by bot");
			return;
		}

		if (
			(reaction.message.author?.bot ?? true) ||
			(reaction.message.author?.id ?? null) == null
		) {
			this.logger.error("some data is null");
			return;
		}

		if (reaction.message.author?.id == null) {
			this.logger.error("author id is null");
			return;
		}

		if (reaction.message.content == null) {
			this.logger.error("content is null");
			return;
		}

		if (reaction.count == null) {
			this.logger.error("count is null");
			return;
		}

		if (reaction.count < APPLY_CROWN_NUM) {
			return;
		}

		if (reaction.message.guildId == null) {
			this.logger.error("guildId is null");
			return;
		}

		if (reaction.message.channelId == null) {
			this.logger.error("channelId is null");
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(reaction.message.guildId)),
			),
		);
		if (communityId == null) {
			return;
		}

		const userId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(reaction.message.author.id)),
				UserType.user,
				new UserCommunityId(communityId.getValue()),
			),
		);
		if (userId == null) {
			return;
		}

		const channelId = await this.ChannelLogic.getIdByCommunityIdAndClientId(
			new ChannelCommunityId(communityId.getValue()),
			new ChannelClientId(BigInt(reaction.message.channelId)),
		);
		if (channelId == null) {
			return;
		}

		const messageId = await this.MessageLogic.getId(
			new MessageDto(
				MessageCategoryType.Discord,
				new MessageClientId(BigInt(reaction.message.id)),
				new MessageCommunityId(communityId.getValue()),
				new MessageUserId(userId.getValue()),
				new MessageChannelId(channelId.getValue()),
			),
		);
		if (messageId == null) {
			return;
		}

		const res = await this.crownLogic.createCrownIfNotExists(
			communityId,
			messageId,
			new CrownMessage(reaction.message.content),
			new CrownMessageLink(reaction.message.url),
		);

		if (res == null) {
			return;
		}

		const channel = reaction.message.guild?.channels.cache.get(
			AppConfig.backend.crownLogChannel,
		);

		if (!(channel instanceof TextChannel)) {
			return;
		}
		await channel.send(`<@${reaction.message.author.id}>さん${res}`);
	}
}
