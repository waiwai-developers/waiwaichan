import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IMinecraftServerLogic } from "@/src/logics/Interfaces/logics/IMinecraftServerLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

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
