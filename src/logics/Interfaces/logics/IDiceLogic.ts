import type { DiceContextDto } from "@/src/entities/dto/DiceContextDto";
import type { EmbedBuilder, ImageURLOptions } from "discord.js";

export interface IDiceLogic {
	dice(
		ctx: DiceContextDto,
		avatarURL: (options?: ImageURLOptions) => string | null,
		send: (embed: EmbedBuilder) => Promise<void>,
	): Promise<EmbedBuilder>;
}
