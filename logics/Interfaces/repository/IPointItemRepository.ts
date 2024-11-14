import type { PointItemDto } from "../../../entities/dto/PointItemDto";
import type { PointItemId } from "../../../entities/vo/PointItemId";

export interface IPointItemRepository {
	findById(id: PointItemId): Promise<PointItemDto | undefined>;
}
