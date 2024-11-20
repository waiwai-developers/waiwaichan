import { ValueObject } from "./ValueObject";

export class UserPointItemStatus extends ValueObject<boolean> {
	static USED = new UserPointItemStatus(true);
	static UNUSED = new UserPointItemStatus(false);
}
