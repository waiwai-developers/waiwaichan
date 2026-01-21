import { ValueObject } from "./ValueObject";

export class ChannelType extends ValueObject<number> {
	static Other = new ChannelType(0);
	static Text = new ChannelType(1);
	static Voice = new ChannelType(2);
}
