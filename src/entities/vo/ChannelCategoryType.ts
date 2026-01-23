import { ValueObject } from "./ValueObject";

export class ChannelCategoryType extends ValueObject<number> {
	static Discord = new ChannelCategoryType(0);
}
