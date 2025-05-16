import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
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
				new CommunityClientId(BigInt(interaction.guildId))
			)
		)
		if (communityId == null) {
			return;
		}

		const userId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(interaction.user.id)),
				new UserCommunityId(communityId.getValue())
			)
		)
		if (userId == null) {
			return;
		}

		await interaction.reply(
			await this.reminderLogic.create(
				new ReminderDto(
					undefined,
					communityId,
					new DiscordChannelId(interaction.channelId),
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
