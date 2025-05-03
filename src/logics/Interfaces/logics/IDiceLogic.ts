import type { DiceContextDto } from "@/src/entities/dto/DiceContextDto";
import type { EmbedBuilder } from "discord.js";

export interface IDiceLogic {
	dice(expr: DiceContextDto): Promise<EmbedBuilder>;
}
