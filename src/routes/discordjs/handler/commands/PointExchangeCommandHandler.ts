import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "src/routes/discordjs/handler/commands/SlashCommandHandler";

@injectable()
export class PointExchangeCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.PointLogic)
	private pointLogic!: IPointLogic;

	isHandle(commandName: string): boolean {
		return commandName === "pointchange";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.pointLogic.exchange(
				new DiscordUserId(interaction.user.id),
				new UserPointItemId(interaction.options.getInteger("id", true)),
			),
		);
	}
}