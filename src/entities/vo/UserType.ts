import { ValueObject } from "./ValueObject";

export class UserType extends ValueObject<number> {
	static user = new UserType(0);
	static bot = new UserType(1);
}
