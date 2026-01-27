import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { GuildMember } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class UserRemoveHandler implements DiscordEventHandler<GuildMember> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.MessageLogic)
	private readonly MessageLogic!: IMessageLogic;

	async handle(member: GuildMember): Promise<void> {
		try {
			if (member.id === AppConfig.discord.clientId) {
				return;
			}
			this.logger.info(
				`UserRemoveHandler: User was removed from guild, guildId: ${member.guild.id}`,
			);

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(member.guild.id)),
				),
			);

			if (communityId == null) {
				return;
			}

			// ユーザー削除前にUserIdを取得
			const userId = await this.UserLogic.getIdByCommunityIdAndClientId(
				new UserCommunityId(communityId.getValue()),
				new UserClientId(BigInt(member.id)),
			);

			// ユーザーを削除
			const isDeletebyClientId =
				await this.UserLogic.deleteByCommunityIdAndClientId(
					new UserCommunityId(communityId.getValue()),
					new UserClientId(BigInt(member.id)),
				);
			if (!isDeletebyClientId) {
				return;
			}

			// ユーザーに関連するメッセージを削除
			if (userId == null) {
				return;
			}
			await this.MessageLogic.deleteByUserIdAndReturnClientIds(
				new MessageUserId(userId.getValue()),
			);
		} catch (error) {
			this.logger.error(`UserRemoveHandler error: ${error}`);
		}
	}
}
