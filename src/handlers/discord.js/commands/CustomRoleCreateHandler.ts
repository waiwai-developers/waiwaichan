import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CustomRoleName } from "@/src/entities/vo/CustomRoleName";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleCreateHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customrolecreate";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

		// Get custom role name from command options
		const name = interaction.options.getString("name", true);

		const result = await this.customRoleLogic.createCustomRole(
			new CustomRoleName(name),
		);

		await interaction.reply(result);
	}
}
