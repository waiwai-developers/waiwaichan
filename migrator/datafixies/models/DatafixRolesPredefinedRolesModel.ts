import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "RolesPredefinedRoles",
})
class DatafixRolesPredefinedRolesModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare roleId: number;
	@Column(DataType.INTEGER)
	declare predefinedRolesId: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.DATE)
	declare createdAt: Date;
	@Column(DataType.DATE)
	declare updatedAt: Date;
	@Column(DataType.DATE)
	declare deletedAt: Date;
}
export { DatafixRolesPredefinedRolesModel };
