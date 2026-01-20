import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyReactionHandler
	implements DiscordEventHandler<ReactionInteraction>
{
	@inject(LogicTypes.CandyLogic)
	private candyLogic!: ICandyLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;

	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	async handle({ reaction, user }: ReactionInteraction): Promise<void> {
		if (!reaction.message.guildId) {
			this.logger.debug("not guild message");
			return;
		}
		if (reaction.partial) {
			try {
				await reaction.fetch();
				await reaction.message.fetch();
				await reaction.message.guild?.channels.fetch();
			} catch (err) {
				this.logger.debug("fail to fetch old message");
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
			this.logger.debug("some data is null");
			return;
		}

		if (reaction.message.author?.id == null) {
			this.logger.debug("author id is null");
			return;
		}

		const candyCategoryType = ((ce) => {
			switch (ce) {
				case AppConfig.backend.candySuperEmoji:
					return CandyCategoryType.CATEGORY_TYPE_SUPER;
				case AppConfig.backend.candyEmoji:
					return CandyCategoryType.CATEGORY_TYPE_NORMAL;
				default:
					return undefined;
			}
		})(reaction.emoji.name);
		if (candyCategoryType == null) {
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

		const receiverUserId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(reaction.message.author.id)),
				UserType.user,
				new UserCommunityId(communityId.getValue()),
			),
		);
		if (receiverUserId == null) {
			return;
		}

		const giveUserId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(user.id)),
				UserType.user,
				new UserCommunityId(communityId.getValue()),
			),
		);
		if (giveUserId == null) {
			return;
		}

		const res = await this.candyLogic.giveCandys(
			communityId,
			receiverUserId,
			giveUserId,
			new DiscordMessageId(reaction.message.id),
			new DiscordMessageLink(reaction.message.url),
			candyCategoryType,
		);
		if (!res) {
			return;
		}

		const channel = reaction.message.guild?.channels.cache.get(
			AppConfig.backend.candyLogChannel,
		);
		if (!(channel instanceof TextChannel)) {
			return;
		}
		await channel.send(
			`<@${reaction.message.author.id}>さんが<@${user.id}>さんに${res}`,
		);
	}
}
