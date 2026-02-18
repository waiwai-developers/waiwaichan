import { CustomRoleDto } from "@/src/entities/dto/CustomRoleDto";
import { CustomRoleCommunityId } from "@/src/entities/vo/CustomRoleCommunityId";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import { CustomRoleName } from "@/src/entities/vo/CustomRoleName";
import type { ICustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/ICustomRoleRepository";
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
	tableName: "CustomRoles",
	timestamps: true,
	paranoid: true,
})
class CustomRoleImpl extends Model implements ICustomRoleRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.STRING)
	declare name: string;

	async create(
		communityId: CustomRoleCommunityId,
		name: CustomRoleName,
	): Promise<CustomRoleId | undefined> {
		return await CustomRoleImpl.create({
			communityId: communityId.getValue(),
			name: name.getValue(),
		}).then((res) => (res ? new CustomRoleId(res.id) : undefined));
	}

	async deleteById(id: CustomRoleId): Promise<boolean> {
		return CustomRoleImpl.destroy({
			where: {
				id: id.getValue(),
			},
		}).then((res) => !!res);
	}

	async findById(id: CustomRoleId): Promise<CustomRoleDto | undefined> {
		return CustomRoleImpl.findOne({
			where: {
				id: id.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async findByName(
		communityId: CustomRoleCommunityId,
		name: CustomRoleName,
	): Promise<CustomRoleDto | undefined> {
		return CustomRoleImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				name: name.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async findAllByCommunityId(
		communityId: CustomRoleCommunityId,
	): Promise<CustomRoleDto[]> {
		return CustomRoleImpl.findAll({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res.map((r) => r.toDto()));
	}

	toDto(): CustomRoleDto {
		return new CustomRoleDto(
			new CustomRoleId(this.id),
			new CustomRoleCommunityId(this.communityId),
			new CustomRoleName(this.name),
		);
	}
}

export { CustomRoleImpl };
