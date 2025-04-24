import { DiceExpression } from "@/src/entities/vo/DiceExpression";
import { EmbedBuilder } from "discord.js";

export interface IDiceLogic {
    dice2(expr: DiceExpression): Promise<EmbedBuilder>;
}