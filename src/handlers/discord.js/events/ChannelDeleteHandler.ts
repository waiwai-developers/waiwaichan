import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DMChannel, GuildChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ChannelDeleteHandler
	implements DiscordEventHandler<GuildChannel | DMChannel>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.ChannelLogic)
	private readonly ChannelLogic!: IChannelLogic;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	async handle(channel: GuildChannel | DMChannel): Promise<void> {
		try {
			if (channel.isDMBased()) {
				return;
			}
			this.logger.info(
				`ChannelDeleteHandler: Channel was deleted, guildId: ${channel.guild.id}, channelId: ${channel.id}`,
			);

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(channel.guild.id)),
				),
			);

			if (communityId == null) {
				return;
			}

			const isDeletebyClientId =
				await this.ChannelLogic.deleteByCommunityIdAndClientId(
					new ChannelCommunityId(communityId.getValue()),
					new ChannelClientId(BigInt(channel.id)),
				);
			if (!isDeletebyClientId) {
				return;
			}
		} catch (error) {
			this.logger.error(`ChannelDeleteHandler error: ${error}`);
		}
	}
}
