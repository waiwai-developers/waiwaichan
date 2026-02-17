import { RolePredefinedRoleDto } from "@/src/entities/dto/RolePredefinedRoleDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
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
	@Column(DataType.INTEGER)
	declare communityId: number;

	async create(data: RolePredefinedRoleDto): Promise<boolean> {
		return await RolePredefinedRoleImpl.create({
			roleId: data.roleId.getValue(),
			predefinedRolesId: data.predefinedRoleId.getValue(),
			communityId: data.communityId.getValue(),
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
			new CommunityId(this.communityId),
		);
	}
}
export { RolePredefinedRoleImpl };
