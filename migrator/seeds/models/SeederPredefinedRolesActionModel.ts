import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "PredefinedRolesCommands",
	timestamps: true,
})
class SeederPredefinedRolesActionModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare predefinedRolesId: number;

	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandCategoryType: number;

	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandType: number;

	async bulkUpsert(
		data: Array<{
			predefinedRolesId: number;
			commandCategoryType: number;
			commandType: number;
		}>,
	) {
		await Promise.all(
			data.map(async (d) => await SeederPredefinedRolesActionModel.upsert(d)),
		);
	}
}

export { SeederPredefinedRolesActionModel };
