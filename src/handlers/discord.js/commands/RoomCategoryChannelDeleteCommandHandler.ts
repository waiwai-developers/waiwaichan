import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoomCategoryChannelLogic } from "@/src/logics/Interfaces/logics/IRoomCategoryChannelLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoomCategoryChannelDeleteCommandHandler
	implements SlashCommandHandler
{
	@inject(LogicTypes.RoomCategoryChannelLogic)
	private roomCategoryChannelLogic!: IRoomCategoryChannelLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "roomcategorychanneldelete";
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
			interaction.reply("カテゴリーチャンネルを登録する権限を持っていないよ！っ");
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
		if (roomCategoryChannel === undefined) {
			await interaction.reply("カテゴリーチャンネルが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			await this.roomCategoryChannelLogic.delete(communityId),
		);
	}
}
