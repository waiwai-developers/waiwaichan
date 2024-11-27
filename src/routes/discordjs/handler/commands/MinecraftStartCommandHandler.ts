import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IMinecraftServerLogic } from "@/src/logics/Interfaces/logics/IMinecraftServerLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "src/routes/discordjs/handler/commands/SlashCommandHandler";

@injectable()
export class MinecraftStartCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.MinecraftServerLogic)
	private mineCraftLogic!: IMinecraftServerLogic;

	isHandle(commandName: string): boolean {
		return commandName === "minecraftstart";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.deferReply();
		await interaction.editReply(await this.mineCraftLogic.startServer());
	}
}

@injectable()
export class MinecraftStopCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.MinecraftServerLogic)
	private mineCraftLogic!: IMinecraftServerLogic;

	isHandle(commandName: string): boolean {
		return commandName === "minecraftstop";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.deferReply();
		await interaction.editReply(await this.mineCraftLogic.stopServer());
	}
}
