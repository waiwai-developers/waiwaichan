import { DataTypes, Model } from "sequelize";
import { PointItemDto } from "../../entities/dto/PointItemDto";
import type { PointItemId } from "../../entities/vo/PointItemId";
import type { IPointItemRepository } from "../../logics/Interfaces/repository/IPointItemRepository";
import type { IModels } from "./Models";
import { MysqlConnector } from "./mysqlConnector";

const sequelize = MysqlConnector.getInstance();

class PointItemRepositoryImpl extends Model implements IPointItemRepository {
	declare id: number;
	declare name: string;
	declare description: string;
	async findById(id: PointItemId): Promise<PointItemDto | undefined> {
		return await PointItemRepositoryImpl.findOne({
			where: { id: id.getValue() },
		}).then((r) =>
			r ? PointItemDto.from(r.id, r.name, r.description) : undefined,
		);
	}
	static associate(models: IModels) {
		PointItemRepositoryImpl.hasMany(models.UserPointItem, {
			foreignKey: "itemId",
		});
	}
}

PointItemRepositoryImpl.init(
	{
		name: DataTypes.STRING,
		description: DataTypes.STRING,
	},
	{
		sequelize,
		modelName: "Item",
	},
);

export { PointItemRepositoryImpl };
