import { ValueObject } from "./ValueObject";

export class RoleBatchStatus extends ValueObject<number> {
	static Yet = new RoleBatchStatus(0);
	static Done = new RoleBatchStatus(1);
}
