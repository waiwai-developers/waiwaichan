import { DiceExpression } from "../entities/vo/DiceExpression";
import { IDiceLogic } from "./Interfaces/logics/IDiceLogic";
import { injectable } from "inversify";

@injectable()
export class DiceLogic implements IDiceLogic {
    async dice2(expr: DiceExpression): Promise<string> {
        if (expr == null) return "パラメーターがないよ！っ";
        return 'dice2だよ！';
    }
}