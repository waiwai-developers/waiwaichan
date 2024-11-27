import type { CacheType, ChatInputCommandInteraction } from "discord.js";

export interface SlashCommandHandler {
	isHandle(commandName: string): boolean;
	handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;
}
