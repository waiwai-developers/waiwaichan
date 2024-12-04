import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Points",
	timestamps: true,
})
class DatafixPointModel extends Model {
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
	@Column(DataType.BOOLEAN)
	declare status: boolean;
	@Column(DataType.DATE)
	declare expiredAt: Date;
	@Column(DataType.DATE)
	declare deletedAt: Date;
}

export { DatafixPointModel };
