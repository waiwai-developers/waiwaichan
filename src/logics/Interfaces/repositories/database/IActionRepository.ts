import type { ActionDto } from "@/src/entities/dto/ActionDto";

export interface IActionRepository {
	create(data: ActionDto): Promise<boolean>;
}
