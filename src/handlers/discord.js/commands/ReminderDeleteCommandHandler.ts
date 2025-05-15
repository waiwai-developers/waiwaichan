import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReminderDeleteCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

@inject(LogicTypes.CommunityLogic)
private CommunityLogic!: ICommunityLogic;

@inject(LogicTypes.UserLogic)
private UserLogic!: IUserLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reminderdelete";
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
			await this.reminderLogic.delete(
				new ReminderId(interaction.options?.getInteger("id", true)),
				communityId,
				userId,
			),
		);
	}
}
