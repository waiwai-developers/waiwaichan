import { CommandDto } from "@/src/entities/dto/CommandDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandName } from "@/src/entities/vo/CommandName";
import { CommandType } from "@/src/entities/vo/CommandType";
import type { ICommandRepository } from "@/src/logics/Interfaces/repositories/database/ICommandRepository";
import { injectable } from "inversify";
import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Commands",
	timestamps: true,
})
class CommandImpl extends Model implements ICommandRepository {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandCategoryType: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandType: number;
	@Column(DataType.STRING)
	declare name: string;

	toDto(): CommandDto {
		return new CommandDto(
			new CommandCategoryType(this.commandCategoryType),
			new CommandType(this.commandType),
			new CommandName(this.name),
		);
	}
}

export { CommandImpl };
