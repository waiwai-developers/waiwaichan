import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Crowns",
})
class DatafixCrownModel extends Model {
	@Column(DataType.INTEGER)
	declare communityId: number;
	@PrimaryKey
	@Column(DataType.STRING)
	declare guildId: string;
	@PrimaryKey
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.DATE)
	declare deletedAt: Date;
	@Column(DataType.DATE)
	declare createdAt: Date;
	@Column(DataType.DATE)
	declare updatedAt: Date;
}
export { DatafixCrownModel };
