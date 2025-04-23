import { DiceExpression } from "@/src/entities/vo/DiceExpression";

export interface IDiceLogic {
    dice2(expr: DiceExpression): Promise<string>;
}