import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
	CreatedAt,
	UpdatedAt,
	DeletedAt,
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
	@CreatedAt
	declare createdAt: Date;
	@UpdatedAt
	declare UpdatedAt: Date;
	@DeletedAt
	declare DeletedAt: Date;
}

export { DatafixPointModel };
