import { RoleCustomRoleDto } from "@/src/entities/dto/RoleCustomRoleDto";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import { RoleCustomRoleCommunityId } from "@/src/entities/vo/RoleCustomRoleCommunityId";
import { RoleId } from "@/src/entities/vo/RoleId";
import type { IRoleCustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleCustomRoleRepository";
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
	tableName: "RolesCustomRoles",
	timestamps: true,
	paranoid: true,
})
class RoleCustomRoleImpl extends Model implements IRoleCustomRoleRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare roleId: number;
	@Column(DataType.INTEGER)
	declare customRoleId: number;

	async create(data: RoleCustomRoleDto): Promise<boolean> {
		return await RoleCustomRoleImpl.create({
			communityId: data.communityId.getValue(),
			roleId: data.roleId.getValue(),
			customRoleId: data.customRoleId.getValue(),
		}).then((res) => !!res);
	}

	async deleteByRoleId(
		communityId: RoleCustomRoleCommunityId,
		roleId: RoleId,
	): Promise<boolean> {
		return RoleCustomRoleImpl.destroy({
			where: {
				communityId: communityId.getValue(),
				roleId: roleId.getValue(),
			},
		}).then((res) => !!res);
	}

	async findByRoleId(
		communityId: RoleCustomRoleCommunityId,
		roleId: RoleId,
	): Promise<RoleCustomRoleDto | undefined> {
		return RoleCustomRoleImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				roleId: roleId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RoleCustomRoleDto {
		return new RoleCustomRoleDto(
			new RoleCustomRoleCommunityId(this.communityId),
			new RoleId(this.roleId),
			new CustomRoleId(this.customRoleId),
		);
	}
}

export { RoleCustomRoleImpl };
