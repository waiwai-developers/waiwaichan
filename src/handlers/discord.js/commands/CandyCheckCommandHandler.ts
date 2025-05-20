import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyCheckCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CandyLogic)
	private candyLogic!: ICandyLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;

	isHandle(commandName: string): boolean {
		return commandName === "candycheck";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

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
			await this.candyLogic.check(
				communityId,
				userId,
			),
		);
	}
}
