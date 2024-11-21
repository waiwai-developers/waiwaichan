import type { PointItemDto } from "@/src/entities/dto/PointItemDto";
import type { PointItemId } from "@/src/entities/vo/PointItemId";

export interface IPointItemRepository {
	findById(id: PointItemId): Promise<PointItemDto | undefined>;
}
