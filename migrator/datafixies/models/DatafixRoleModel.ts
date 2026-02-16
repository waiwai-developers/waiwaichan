import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Roles",
})
class DatafixRoleModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.BIGINT)
	declare clientId: string;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare batchStatus: number;
	@Column(DataType.DATE)
	declare deletedAt: Date;
	@Column(DataType.DATE)
	declare createdAt: Date;
	@Column(DataType.DATE)
	declare updatedAt: Date;
}
export { DatafixRoleModel };
