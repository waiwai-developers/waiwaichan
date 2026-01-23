import { ValueObject } from "./ValueObject";

export class ChannelBatchStatus extends ValueObject<number> {
	static Yet = new ChannelBatchStatus(0);
	static Done = new ChannelBatchStatus(1);
}
