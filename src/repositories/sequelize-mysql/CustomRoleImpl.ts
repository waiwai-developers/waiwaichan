import { CustomRoleDto } from "@/src/entities/dto/CustomRoleDto";
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
	@Column(DataType.STRING)
	declare name: string;

	async create(name: CustomRoleName): Promise<CustomRoleId | undefined> {
		return await CustomRoleImpl.create({
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

	async findByName(name: CustomRoleName): Promise<CustomRoleDto | undefined> {
		return CustomRoleImpl.findOne({
			where: {
				name: name.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): CustomRoleDto {
		return new CustomRoleDto(
			new CustomRoleId(this.id),
			new CustomRoleName(this.name),
		);
	}
}

export { CustomRoleImpl };
