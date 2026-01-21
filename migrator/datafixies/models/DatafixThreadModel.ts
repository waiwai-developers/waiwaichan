import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Threads",
})
class DatafixThreadModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare communityId: number;
	@PrimaryKey
	@Column(DataType.BIGINT)
	declare messageId: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.DATE)
	declare deletedAt: Date;
	@Column(DataType.DATE)
	declare createdAt: Date;
	@Column(DataType.DATE)
	declare updatedAt: Date;
	@Column(DataType.JSON)
	declare metadata: JSON;
}
export { DatafixThreadModel };
