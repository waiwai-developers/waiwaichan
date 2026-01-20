import type { UserId } from "@/src/entities/vo/UserId";

export class ColumnUserDto {
	readonly columnName = "user" as const;

	constructor(public readonly userId: UserId) {}
}
