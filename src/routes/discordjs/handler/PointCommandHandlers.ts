import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
export class PointCheckCommandHandlers implements SlashCommandHandler {
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

@injectable()
export class PointDrawCommandHandlers implements SlashCommandHandler {
	@inject(LogicTypes.PointLogic)
	private pointLogic!: IPointLogic;

	isHandle(commandName: string): boolean {
		return commandName === "pointdraw";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.pointLogic.drawItem(new DiscordUserId(interaction.user.id)),
		);
	}
}

@injectable()
export class PointItemCommandHandlers implements SlashCommandHandler {
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

@injectable()
export class PointExchangeCommandHandlers implements SlashCommandHandler {
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
				new UserPointItemId(interaction.options.getInteger("id") ?? 0),
			),
		);
	}
}
