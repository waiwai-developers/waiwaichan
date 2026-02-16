import { PredefinedRoleDto } from "@/src/entities/dto/PredefinedRoleDto";
import { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import { PredefinedRoleName } from "@/src/entities/vo/PredefinedRoleName";
import type { IPredefinedRoleRepository } from "@/src/logics/Interfaces/repositories/database/IPredefinedRoleRepository";
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
	tableName: "PredefinedRoles",
	timestamps: true,
})
class PredefinedRoleImpl extends Model implements IPredefinedRoleRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;

	toDto(): PredefinedRoleDto {
		return new PredefinedRoleDto(
			new PredefinedRoleId(this.id),
			new PredefinedRoleName(this.name),
		);
	}
}

export { PredefinedRoleImpl };
