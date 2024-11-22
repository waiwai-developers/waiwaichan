import { MysqlConnector } from "@/src/repositories/sequelize-mysql/mysqlConnector";
import { DataTypes, Model } from "sequelize";

const sequelize = MysqlConnector.getInstance();

class MigratePointItemModel extends Model {
	declare id: number;
	declare name: string;
	declare description: string;

	async bulkFindOrCreate(
		data: Array<{ id: number; name: string; description: string }>,
	) {
		await Promise.all(
			data.map(async (d) => await MigratePointItemModel.upsert(d)),
		);
	}
}

MigratePointItemModel.init(
	{
		name: DataTypes.STRING,
		description: DataTypes.STRING,
	},
	{
		sequelize,
		modelName: "Item",
	},
);

export { MigratePointItemModel };
