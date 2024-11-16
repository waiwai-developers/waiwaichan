import { DataTypes, Model } from "sequelize";
import { MysqlConnector } from "./mysqlConnector.js";
const sequelize = MysqlConnector.getInstance();

export const Point = (() => {
	class Point extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `database/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	Point.init(
		{
			receiveUserId: DataTypes.BIGINT,
			giveUserId: DataTypes.BIGINT,
			messageId: DataTypes.BIGINT,
			status: DataTypes.BOOLEAN,
			expiredAt: DataTypes.DATE,
		},
		{
			sequelize,
			modelName: "Point",
		},
	);

	Point.STATUS_VALID = 0;
	Point.STATUS_INVALID = 1;

	return Point;
})();
