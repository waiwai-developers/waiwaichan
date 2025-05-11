import type { ActionDto } from "@/src/entities/dto/ActionDto";

export interface ICommunityRepository {
	create(data: ActionDto): Promise<boolean>;
	delete(data: ActionDto): Promise<boolean>;
}
