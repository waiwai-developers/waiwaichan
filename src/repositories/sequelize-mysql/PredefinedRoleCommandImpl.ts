import { PredefinedRoleCommandDto } from "@/src/entities/dto/PredefinedRoleCommandDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { PredefinedRoleCommandIsAllow } from "@/src/entities/vo/PredefinedRoleCommandIsAllow";
import { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { IPredefinedRoleCommandRepository } from "@/src/logics/Interfaces/repositories/database/IPredefinedRoleCommandRepository";
import { injectable } from "inversify";
import { Op } from "sequelize";
import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "PredefinedRolesCommands",
	timestamps: true,
})
class PredefinedRoleCommandImpl
	extends Model
	implements IPredefinedRoleCommandRepository
{
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare predefinedRolesId: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandCategoryType: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandType: number;
	@Column(DataType.BOOLEAN)
	declare isAllow: boolean;

	async checkCommandPermission(
		predefinedRoleIds: PredefinedRoleId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean> {
		if (predefinedRoleIds.length === 0) {
			return false;
		}

		const result = await PredefinedRoleCommandImpl.findOne({
			where: {
				predefinedRolesId: {
					[Op.in]: predefinedRoleIds.map((id) => id.getValue()),
				},
				commandCategoryType: commandCategoryType.getValue(),
				commandType: commandType.getValue(),
				isAllow: true,
			},
		});

		return !!result;
	}

	toDto(): PredefinedRoleCommandDto {
		return new PredefinedRoleCommandDto(
			new PredefinedRoleId(this.predefinedRolesId),
			new CommandCategoryType(this.commandCategoryType),
			new CommandType(this.commandType),
			new PredefinedRoleCommandIsAllow(this.isAllow),
		);
	}
}

export { PredefinedRoleCommandImpl };
