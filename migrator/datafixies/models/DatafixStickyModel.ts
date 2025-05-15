import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@Table({
	tableName: "Stickies",
})
class DatafixStickyModel extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.STRING)
	declare channelId: string;
	@Column(DataType.STRING)
	declare userId: string;
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.STRING)
	declare message: string;
}
export { DatafixStickyModel };
