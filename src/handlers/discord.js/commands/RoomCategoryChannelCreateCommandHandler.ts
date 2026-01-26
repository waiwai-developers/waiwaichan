import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoomCategoryChannelDto } from "@/src/entities/dto/RoomCategoryChannelDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoomCategoryChannelLogic } from "@/src/logics/Interfaces/logics/IRoomCategoryChannelLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { CategoryChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoomCategoryChannelCreateCommandHandler
	implements SlashCommandHandler
{
	@inject(LogicTypes.RoomCategoryChannelLogic)
	private roomCategoryChannelLogic!: IRoomCategoryChannelLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	isHandle(commandName: string): boolean {
		return commandName === "roomcategorychannelcreate";
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
				"カテゴリーチャンネルを登録する権限を持っていないよ！っ",
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

		const roomCategoryChannel =
			await this.roomCategoryChannelLogic.find(communityId);
		if (roomCategoryChannel !== undefined) {
			await interaction.reply("カテゴリーチャンネルが既に登録されているよ！っ");
			return;
		}

		const targetChannelId = interaction.options.getString("channelid", true);
		const channel = interaction.guild?.channels.cache.get(targetChannelId);
		if (!(channel instanceof CategoryChannel)) {
			await interaction.reply(
				"このチャンネルはカテゴリーチャンネルでないのでカテゴリーチャンネルとして登録できないよ！っ",
			);
			return;
		}

		const channelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(BigInt(targetChannelId)),
				ChannelType.DiscordCategory,
				new ChannelCommunityId(communityId.getValue()),
			),
		);
		if (channelId == null) {
			await interaction.reply("カテゴリーチャンネルが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			await this.roomCategoryChannelLogic.create(
				new RoomCategoryChannelDto(communityId, channelId),
			),
		);
	}
}
