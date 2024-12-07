import { CandyItemDto } from "@/src/entities/dto/CandyItemDto";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import { injectable } from "inversify";
import {
	AutoIncrement,
	Column,
	DataType,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Items",
	timestamps: true,
})
class CandyItemRepositoryImpl extends Model implements ICandyItemRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.STRING)
	declare description: string;

	@HasMany(() => UserCandyItemRepositoryImpl)
	declare itemOwners: UserCandyItemRepositoryImpl[];

	async findById(id: CandyItemId): Promise<CandyItemDto | undefined> {
		return await CandyItemRepositoryImpl.findOne({
			where: { id: id.getValue() },
		}).then((r) => (r ? this.toDto(r.id, r.name, r.description) : undefined));
	}

	toDto(id: number, name: string, description: string): CandyItemDto {
		return new CandyItemDto(
			new CandyItemId(id),
			new CandyItemName(name),
			new CandyItemDescription(description),
		);
	}
}

export { CandyItemRepositoryImpl };
