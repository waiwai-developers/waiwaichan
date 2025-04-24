import { User } from "discord.js";
import { ValueObject } from "./ValueObject";

export class DiceExpression extends ValueObject<{ source: string, isSecret: boolean, showDetails: boolean, user: User }> { }