import { DataTypes, Model } from "sequelize";
import { MysqlConnector } from "./mysqlConnector.js";
const sequelize = MysqlConnector.getInstance();

export const Reminder = (() => {
	class Reminder extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `sequelize-mysql/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	Reminder.init(
		{
			channelId: DataTypes.BIGINT,
			userId: DataTypes.BIGINT,
			message: DataTypes.STRING,
			remindAt: DataTypes.DATE,
		},
		{
			sequelize,
			modelName: "Reminder",
		},
	);
	return Reminder;
})();
