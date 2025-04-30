import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "PersonalityCategories",
})
class DatafixPersonalityCategoryModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare context: JSON;
}
export { DatafixPersonalityCategoryModel };
