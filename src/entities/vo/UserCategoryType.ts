import { ValueObject } from "./ValueObject";

export class UserCategoryType extends ValueObject<number> {
	static Discord = new UserCategoryType(0);
}
