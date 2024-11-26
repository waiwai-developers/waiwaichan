import { PointItemDto } from "@/src/entities/dto/PointItemDto";
import { PointItemDescription } from "@/src/entities/vo/PointItemDescription";
import { PointItemId } from "@/src/entities/vo/PointItemId";
import { PointItemName } from "@/src/entities/vo/PointItemName";
import type { IPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IPointItemRepository";
import { injectable } from "inversify";
import { Column, Model, Table } from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Items",
	timestamps: true,
})
class PointItemRepositoryImpl extends Model implements IPointItemRepository {
	@Column
	declare id: number;
	@Column
	declare name: string;
	@Column
	declare description: string;

	async findById(id: PointItemId): Promise<PointItemDto | undefined> {
		return await PointItemRepositoryImpl.findOne({
			where: { id: id.getValue() },
		}).then((r) => (r ? this.toDto(r.id, r.name, r.description) : undefined));
	}

	toDto(id: number, name: string, description: string): PointItemDto {
		return new PointItemDto(
			new PointItemId(id),
			new PointItemName(name),
			new PointItemDescription(description),
		);
	}
}

export { PointItemRepositoryImpl };
