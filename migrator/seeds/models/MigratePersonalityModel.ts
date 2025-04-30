import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Personalities",
	timestamps: true,
})
class MigratePersonalityModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare personality: JSON;

	async bulkUpsert(
		data: Array<{ id: number; name: string; personality: JSON }>,
	) {
		await Promise.all(
			data.map(async (d) => await MigratePersonalityModel.upsert(d)),
		);
	}
}

export { MigratePersonalityModel };
