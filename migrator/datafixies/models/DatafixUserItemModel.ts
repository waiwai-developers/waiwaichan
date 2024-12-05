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
	@CreatedAt
	declare createdAt: Date;
	@UpdatedAt
	declare UpdatedAt: Date;
	@DeletedAt
	declare DeletedAt: Date;
}
export { DatafixUserItemModel };
