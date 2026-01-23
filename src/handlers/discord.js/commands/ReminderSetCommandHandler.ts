import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import dayjs from "dayjs";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReminderSetCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reminderset";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
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

		const userId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(interaction.user.id)),
				UserType.user,
				new UserCommunityId(communityId.getValue()),
			),
		);
		if (userId == null) {
			await interaction.reply("ユーザーが登録されていなかったよ！っ");
			return;
		}

		const channelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(BigInt(interaction.channelId)),
				ChannelType.DiscordText,
				new ChannelCommunityId(communityId.getValue()),
			),
		);
		if (channelId == null) {
			await interaction.reply("チャンネルが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			await this.reminderLogic.create(
				new ReminderDto(
					undefined,
					communityId,
					channelId,
					userId,
					new ReceiveDiscordUserName(
						interaction.options.getString("username", true),
					),
					new ReminderMessage(interaction.options.getString("message", true)),
					new RemindTime(
						dayjs(interaction.options.getString("datetime"))
							.subtract(9, "h")
							.toDate(),
					),
				),
			),
		);
	}
}
