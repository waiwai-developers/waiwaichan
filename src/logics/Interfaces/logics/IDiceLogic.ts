import type { DiceExpressionDto } from "@/src/entities/dto/DiceContextDto";
import type { EmbedBuilder } from "discord.js";

export interface IDiceLogic {
    dice2(expr: DiceExpressionDto): Promise<EmbedBuilder>;
}