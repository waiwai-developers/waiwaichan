import { RolePredefinedRoleDto } from "@/src/entities/dto/RolePredefinedRoleDto";
import { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import { RoleId } from "@/src/entities/vo/RoleId";
import type { IRolePredefinedRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRolePredefinedRoleRepository";
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
	tableName: "RolesPredefinedRoles",
	timestamps: true,
	paranoid: true,
})
class RolePredefinedRoleImpl
	extends Model
	implements IRolePredefinedRoleRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare roleId: number;
	@Column(DataType.INTEGER)
	declare predefinedRolesId: number;

	async create(data: RolePredefinedRoleDto): Promise<boolean> {
		return await RolePredefinedRoleImpl.create({
			roleId: data.roleId.getValue(),
			predefinedRolesId: data.predefinedRoleId.getValue(),
		}).then((res) => !!res);
	}

	async deleteByRoleId(roleId: RoleId): Promise<boolean> {
		return RolePredefinedRoleImpl.destroy({
			where: {
				roleId: roleId.getValue(),
			},
		}).then((res) => !!res);
	}

	async findByRoleId(
		roleId: RoleId,
	): Promise<RolePredefinedRoleDto | undefined> {
		return RolePredefinedRoleImpl.findOne({
			where: {
				roleId: roleId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RolePredefinedRoleDto {
		return new RolePredefinedRoleDto(
			new RoleId(this.roleId),
			new PredefinedRoleId(this.predefinedRolesId),
		);
	}
}
export { RolePredefinedRoleImpl };
