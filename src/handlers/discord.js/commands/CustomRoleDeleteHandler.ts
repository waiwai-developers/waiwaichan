import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleDeleteHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customroledelete";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

		// Get custom role ID from command options
		const customRoleId = interaction.options.getInteger("customroleid", true);

		const result = await this.customRoleLogic.deleteCustomRole(
			new CustomRoleId(customRoleId),
		);

		await interaction.reply(result);
	}
}
