import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "item",
	timestamps: true,
})
class MigratePointItemModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.STRING)
	declare description: string;

	async bulkUpsert(
		data: Array<{ id: number; name: string; description: string }>,
	) {
		await Promise.all(
			data.map(async (d) => await MigratePointItemModel.upsert(d)),
		);
	}
}

export { MigratePointItemModel };
