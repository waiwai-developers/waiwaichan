'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Point extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Point.init({
    receiveUserId: DataTypes.BIGINT,
    giveUserId: DataTypes.BIGINT,
    messageId: DataTypes.BIGINT,
    status: DataTypes.BOOLEAN,
    expiredAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Point',
  });

  Point.STATUS_VALID = 0
  Point.STATUS_INVALID = 1

  return Point;
};