import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import type { SlashCommandHandler } from "@/src/handler/discord.js/commands/SlashCommandHandler";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class PointCheckCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.PointLogic)
	private pointLogic!: IPointLogic;

	isHandle(commandName: string): boolean {
		return commandName === "pointcheck";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.pointLogic.check(new DiscordUserId(interaction.user.id)),
		);
	}
}
