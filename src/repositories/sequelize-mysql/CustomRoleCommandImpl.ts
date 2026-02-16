import { CustomRoleCommandDto } from "@/src/entities/dto/CustomRoleCommandDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { ICustomRoleCommandRepository } from "@/src/logics/Interfaces/repositories/database/ICustomRoleCommandRepository";
import { injectable } from "inversify";
import { Op } from "sequelize";
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
	tableName: "CustomRolesCommands",
	timestamps: true,
	paranoid: true,
})
class CustomRoleCommandImpl extends Model implements ICustomRoleCommandRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare customRoleId: number;
	@Column(DataType.INTEGER)
	declare commandCategoryType: number;
	@Column(DataType.INTEGER)
	declare commandType: number;
	@Column(DataType.BOOLEAN)
	declare isAllow: boolean;

	async updateOrCreate(data: CustomRoleCommandDto): Promise<boolean> {
		const existing = await CustomRoleCommandImpl.findOne({
			where: {
				customRoleId: data.customRoleId.getValue(),
				commandCategoryType: data.commandCategoryType.getValue(),
				commandType: data.commandType.getValue(),
			},
		});

		if (existing) {
			existing.isAllow = data.isAllow.getValue();
			return await existing.save().then(() => true);
		}

		return await CustomRoleCommandImpl.create({
			customRoleId: data.customRoleId.getValue(),
			commandCategoryType: data.commandCategoryType.getValue(),
			commandType: data.commandType.getValue(),
			isAllow: data.isAllow.getValue(),
		}).then((res) => !!res);
	}

	async deleteByCustomRoleId(customRoleId: CustomRoleId): Promise<boolean> {
		return CustomRoleCommandImpl.destroy({
			where: {
				customRoleId: customRoleId.getValue(),
			},
		}).then((res) => !!res);
	}

	async findByCustomRoleIdAndCommand(
		customRoleId: CustomRoleId,
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<CustomRoleCommandDto | undefined> {
		return CustomRoleCommandImpl.findOne({
			where: {
				customRoleId: customRoleId.getValue(),
				commandCategoryType: commandCategoryType.getValue(),
				commandType: commandType.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async checkCommandPermission(
		customRoleIds: CustomRoleId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean> {
		if (customRoleIds.length === 0) {
			return false;
		}

		const result = await CustomRoleCommandImpl.findOne({
			where: {
				customRoleId: {
					[Op.in]: customRoleIds.map((id) => id.getValue()),
				},
				commandCategoryType: commandCategoryType.getValue(),
				commandType: commandType.getValue(),
				isAllow: true,
			},
		});

		return !!result;
	}

	toDto(): CustomRoleCommandDto {
		return new CustomRoleCommandDto(
			new CustomRoleId(this.customRoleId),
			new CommandCategoryType(this.commandCategoryType),
			new CommandType(this.commandType),
			new CustomRoleCommandIsAllow(this.isAllow),
		);
	}
}

export { CustomRoleCommandImpl };
