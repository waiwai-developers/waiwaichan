import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class PointItemCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.PointLogic)
	private pointLogic!: IPointLogic;

	isHandle(commandName: string): boolean {
		return commandName === "pointitem";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.pointLogic.getItems(new DiscordUserId(interaction.user.id)),
		);
	}
}
