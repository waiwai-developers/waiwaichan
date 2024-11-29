import { ValueObject } from "./ValueObject";

export class ReminderStatus extends ValueObject<boolean> {
	static VALID = new ReminderStatus(true);
	static INVALID = new ReminderStatus(false);
}
