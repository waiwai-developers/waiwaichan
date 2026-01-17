import { ValueObject } from "./ValueObject";

export class CommunityCategoryType extends ValueObject<number> {
	static Discord = new CommunityCategoryType(0);
}
