import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Candies",
})
class DatafixCandyModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.BIGINT)
	declare receiveUserId: number;
	@Column(DataType.BIGINT)
	declare giveUserId: number;
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.DATE)
	declare expiredAt: Date;
	@Column(DataType.DATE)
	declare createdAt: Date;
	@Column(DataType.DATE)
	declare updatedAt: Date;
	@Column(DataType.DATE)
	declare deletedAt: Date;
}

export { DatafixCandyModel };
