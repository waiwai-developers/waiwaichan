import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleReleasedByCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customrolereleasedbycommand";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
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
			new CustomRoleId(customRoleId),
			new CommandCategoryType(commandCategoryType),
			new CommandType(commandType),
			new CustomRoleCommandIsAllow(false),
		);

		await interaction.reply(result);
	}
}
