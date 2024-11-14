import { ValueObject } from "./ValueObject";

export class UserItemStatus extends ValueObject<boolean> {
	static USED = new UserItemStatus(true);
	static UNUSED = new UserItemStatus(false);
}
