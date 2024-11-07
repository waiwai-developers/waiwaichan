'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserItem.init({
    userId: DataTypes.BIGINT,
    itemId: DataTypes.INTEGER,
    status: DataTypes.BOOLEAN,
    expiredAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserItem',
  });

  UserItem.associate = models => {
    UserItem.belongsTo(models.Item, { as: 'user', foreignKey: 'userId' })
  }

  UserItem.STATUS_VALID = 0
  UserItem.STATUS_INVALID = 1

  return UserItem;
};
