import { ValueObject } from "./ValueObject";

export class RoleCategoryType extends ValueObject<number> {
	static Discord = new RoleCategoryType(0);
}
