import type { CandyItemDto } from "@/src/entities/dto/CandyItemDto";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";

export interface ICandyItemRepository {
	findById(id: CandyItemId): Promise<CandyItemDto | undefined>;
	findAll(): Promise<CandyItemDto[] | undefined>;
}
