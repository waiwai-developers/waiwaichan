import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
<<<<<<< Updated upstream
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
=======
import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
>>>>>>> Stashed changes
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReminderListCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

	@inject(LogicTypes.CommunityLogic)
<<<<<<< Updated upstream
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;
=======
	private communityLogic!: ICommunityLogic;
>>>>>>> Stashed changes

	isHandle(commandName: string): boolean {
		return commandName === "reminderlist";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

<<<<<<< Updated upstream
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
				UserType.user,
				new UserCommunityId(communityId.getValue())
			)
		)
		if (userId == null) {
=======
		const communityId = await this.communityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply(InternalErrorMessage);
>>>>>>> Stashed changes
			return;
		}

		await interaction.reply(
			await this.reminderLogic.list(
				communityId,
<<<<<<< Updated upstream
				userId,
=======
				new DiscordUserId(interaction.user.id),
>>>>>>> Stashed changes
			),
		);
	}
}
