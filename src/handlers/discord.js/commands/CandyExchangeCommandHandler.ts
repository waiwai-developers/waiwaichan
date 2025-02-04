import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyExchangeCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CandyLogic)
	private candyLogic!: ICandyLogic;

	isHandle(commandName: string): boolean {
		return commandName === "candyexchange";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.candyLogic.exchange(
				new DiscordUserId(interaction.user.id),
				new CandyItemId(interaction.options.getInteger("type", true)),
				new UserCandyItemCount(interaction.options.getInteger("amount") ?? 1),
			),
		);
	}
}
