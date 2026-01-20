import { ValueObject } from "./ValueObject";

export class ColumnName extends ValueObject<string> {
	static user = new ColumnName("user");
	static community = new ColumnName("community");
}
