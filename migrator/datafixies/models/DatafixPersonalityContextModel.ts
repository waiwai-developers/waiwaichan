import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "PersonalityContexts",
})
class DatafixPersonalityContextModel extends Model {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare contextId: number;
}
export { DatafixPersonalityContextModel };
