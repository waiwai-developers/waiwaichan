import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChoiceContent } from "@/src/entities/vo/ChoiceContent";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { SlashCommandHandler } from "@/src/routes/discordjs/handler/commands/SlashCommandHandler";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ChoiceCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "choice";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.choice(
				interaction.options
					.getString("items", true)
					.split(" ")
					.map((r) => new ChoiceContent(r)),
			),
		);
	}
}
