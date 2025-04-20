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
})
class DatafixUserItemModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.BIGINT)
	declare guildId: number;
	@Column(DataType.BIGINT)
	declare userId: number;
	@Column(DataType.INTEGER)
	declare itemId: number;
	@Column(DataType.DATE)
	declare expiredAt: Date;
	@Column(DataType.DATE)
	declare createdAt: Date;
	@Column(DataType.DATE)
	declare updatedAt: Date;
	@Column(DataType.DATE)
	declare deletedAt: Date;
}
export { DatafixUserItemModel };
