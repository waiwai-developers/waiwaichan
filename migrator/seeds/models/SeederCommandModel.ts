import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Commands",
	timestamps: true,
})
class SeederCommandModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandCategoryType: number;

	@PrimaryKey
	@Column(DataType.INTEGER)
	declare commandType: number;

	@Column(DataType.STRING)
	declare name: string;

	async bulkUpsert(
		data: Array<{
			commandCategoryType: number;
			commandType: number;
			name: string;
		}>,
	) {
		await Promise.all(
			data.map(async (d) => await SeederCommandModel.upsert(d)),
		);
	}
}

export { SeederCommandModel };
