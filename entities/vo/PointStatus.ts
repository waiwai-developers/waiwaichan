import { ValueObject } from "./ValueObject";

export class PointStatus extends ValueObject<boolean> {
	static USED = new PointStatus(true);
	static UNUSED = new PointStatus(false);
}
