import { ContextDto } from "@/src/entities/dto/ContextDto";
import type { ContextId } from "@/src/entities/vo/ContextId";
import { ContextName } from "@/src/entities/vo/ContextName";
import { ContextPrompt } from "@/src/entities/vo/ContextPrompt";

import type { IContextRepository } from "@/src/logics/Interfaces/repositories/database/IContextRepository";
import { injectable } from "inversify";
import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Contexts",
	timestamps: true,
})
class ContextRepositoryImpl extends Model implements IContextRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare prompt: JSON;

	async findById(id: ContextId): Promise<ContextDto | undefined> {
		return ContextRepositoryImpl.findOne({
			where: {
				id: id.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): ContextDto {
		return new ContextDto(
			new ContextName(this.name),
			new ContextPrompt(this.prompt),
		);
	}
}
export { ContextRepositoryImpl };
