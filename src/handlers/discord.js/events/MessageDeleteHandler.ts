import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Message, PartialMessage } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class MessageDeleteHandler
	implements DiscordEventHandler<Message | PartialMessage>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.MessageLogic)
	private readonly MessageLogic!: IMessageLogic;

	async handle(message: Message | PartialMessage): Promise<void> {
		try {
			if (!message.guild) {
				return;
			}

			if (message.author?.id === AppConfig.discord.clientId) {
				return;
			}

			this.logger.info(
				`ActionRemoveMessageHandler: Message was deleted from guild, guildId: ${message.guild.id}, messageId: ${message.id}`,
			);

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(message.guild.id)),
				),
			);

			if (communityId == null) {
				return;
			}

			const isDeletebyClientId =
				await this.MessageLogic.deleteByCommunityIdAndClientId(
					new MessageCommunityId(communityId.getValue()),
					new MessageClientId(BigInt(message.id)),
				);
			if (!isDeletebyClientId) {
				return;
			}
		} catch (error) {
			this.logger.error(`ActionRemoveMessageHandler error: ${error}`);
		}
	}
}
