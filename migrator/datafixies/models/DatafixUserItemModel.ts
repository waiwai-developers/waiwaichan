import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "UserItems",
	timestamps: true,
})
class DatafixUserItemModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.BIGINT)
	declare userId: number;
	@Column(DataType.INTEGER)
	declare itemId: number;
	@Column(DataType.BOOLEAN)
	declare status: boolean;
	@Column(DataType.DATE)
	declare expiredAt: Date;

	async bulkUpsert(
		data: Array<{
			id: number;
			userId: number;
			itemId: number;
			status: boolean;
			expiredAt: Date;
		}>,
	) {
		return await Promise.all(
			data.map(async (d) => await DatafixUserItemModel.upsert(d)),
		);
	}
	async findAll() {
		return await DatafixUserItemModel.findAll();
	}
}

export { DatafixUserItemModel };
