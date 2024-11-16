import { DataTypes, Model } from "sequelize";
import { MysqlConnector } from "./mysqlConnector.js";
const sequelize = MysqlConnector.getInstance();

export const UserItem = (() => {
	class UserItem extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `sequelize-mysql/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	UserItem.init(
		{
			userId: DataTypes.BIGINT,
			itemId: DataTypes.INTEGER,
			status: DataTypes.BOOLEAN,
			expiredAt: DataTypes.DATE,
		},
		{
			sequelize,
			modelName: "UserItem",
		},
	);

	UserItem.associate = (models) => {
		UserItem.belongsTo(models.Item, { as: "item", foreignKey: "itemId" });
	};

	UserItem.STATUS_VALID = 0;
	UserItem.STATUS_INVALID = 1;

	return UserItem;
})();
