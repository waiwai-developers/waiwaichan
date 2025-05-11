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
class MigratePersonalityContextModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare categoryId: number;

	async bulkUpsert(
		data: Array<{ personalityId: number; categoryId: number; }>,
	) {
		await Promise.all(
			data.map(async (d) => await MigratePersonalityContextModel.upsert(d)),
		);
	}
}

export { MigratePersonalityContextModel };
