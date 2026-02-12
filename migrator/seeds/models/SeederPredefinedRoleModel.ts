import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "PredefinedRoles",
	timestamps: true,
})
class SeederPredefinedRoleModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;

	async bulkUpsert(data: Array<{ id: number; name: string }>) {
		await Promise.all(
			data.map(async (d) => await SeederPredefinedRoleModel.upsert(d)),
		);
	}
}

export { SeederPredefinedRoleModel };
