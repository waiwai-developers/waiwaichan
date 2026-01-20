import type { UserId } from "@/src/entities/vo/UserId";

export class ColumnUserDto {
	readonly columnName: "user" = "user";

	constructor(
		public readonly userId: UserId,
	) {}
}
