import { ValueObject } from "./ValueObject";

export class MessageCategoryType extends ValueObject<number> {
	static Discord = new MessageCategoryType(0);
}
