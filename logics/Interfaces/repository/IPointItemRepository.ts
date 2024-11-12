import type { PointItemDto } from "../../../entities/dto/PointItemDto";

export interface IPointItemRepository {
	findOne(): PointItemDto;
}
