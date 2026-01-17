import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Contexts",
	timestamps: true,
})
class SeederContextModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare prompt: JSON;

	async bulkUpsert(data: Array<{ id: number; name: string; prompt: JSON }>) {
		await Promise.all(
			data.map(async (d) => await SeederContextModel.upsert(d)),
		);
	}
}

export { SeederContextModel };
