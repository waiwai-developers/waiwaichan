import { DataTypes, Model } from "sequelize";
import { MysqlConnector } from "./mysqlConnector.js";
const sequelize = MysqlConnector.getInstance();

export const Item = (() => {
	class Item extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `sequelize-mysql/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	Item.init(
		{
			name: DataTypes.STRING,
			description: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: "Item",
		},
	);

	Item.associate = (models) => {
		Item.hasMany(models.UserItem, { foreignKey: "itemId" });
	};

	Item.PROBABILITY_JACKPOD = 100;
	Item.PROBABILITY_HIT = 3;
	Item.ID_JACKPOD = 1;
	Item.ID_HIT = 2;

	return Item;
})();
