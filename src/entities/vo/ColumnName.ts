import { ValueObject } from "./ValueObject";

export class ColumnName extends ValueObject<string> {
	static user = new ColumnName("userId");
	static community = new ColumnName("communityId");
	static channel = new ColumnName("channelId");
}
