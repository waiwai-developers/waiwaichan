import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "PersonalityContexts",
	timestamps: true,
})
class SeederPersonalityContextModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare contextId: number;

	async bulkUpsert(data: Array<{ personalityId: number; contextId: number }>) {
		await Promise.all(
			data.map(async (d) => await SeederPersonalityContextModel.upsert(d)),
		);
	}
}

export { SeederPersonalityContextModel };
