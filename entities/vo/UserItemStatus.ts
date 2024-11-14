import { ValueObject } from "./ValueObject";

const USED = 0;
const UNUSED = 1;
export const USER_ITEM_STATUS: number[] = [USED, UNUSED];

export class UserItemStatus extends ValueObject<number> {
	validator = (value: number) => USER_ITEM_STATUS.includes(value);
}
