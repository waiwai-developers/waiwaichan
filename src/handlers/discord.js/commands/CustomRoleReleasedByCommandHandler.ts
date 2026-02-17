import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleReleasedByCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customrolereleasedbycommand";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

		// Get community ID
		const communityId = await this.communityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		// Get custom role ID from command options
		const customRoleId = interaction.options.getInteger("customroleid", true);

		// Get command category type from command options
		const commandCategoryType = interaction.options.getInteger(
			"commandcategorytype",
			true,
		);

		// Get command type from command options
		const commandType = interaction.options.getInteger("commandtype", true);

		// Set isAllow to false to release permission
		const result = await this.customRoleLogic.updateCommandPermission(
			communityId,
			new CustomRoleId(customRoleId),
			new CommandCategoryType(commandCategoryType),
			new CommandType(commandType),
			new CustomRoleCommandIsAllow(false),
		);

		await interaction.reply(result);
	}
}
