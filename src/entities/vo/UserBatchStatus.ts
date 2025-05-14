import { ValueObject } from "./ValueObject";

export class UserBatchStatus extends ValueObject<number> {
	static Yet = new UserBatchStatus(0);
	static Done = new UserBatchStatus(1);
}
