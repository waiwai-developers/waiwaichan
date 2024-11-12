import type { ItemDto } from "../../../entities/dto/ItemDto";

export interface IItemRepository {
	findOne(): ItemDto;
}
