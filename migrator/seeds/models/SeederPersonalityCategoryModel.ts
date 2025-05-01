import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "PersonalityCategories",
	timestamps: true,
})
class SeederPersonalityCategoryModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare context: JSON;

	async bulkUpsert(
		data: Array<{ id: number; personalityId: number, name: string; context: JSON }>,
	) {
		await Promise.all(
			data.map(async (d) => await SeederPersonalityCategoryModel.upsert(d)),
		);
	}
}

export { SeederPersonalityCategoryModel };
