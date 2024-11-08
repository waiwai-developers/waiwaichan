'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Points', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      receiveUserId: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      giveUserId: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      messageId: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      status: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      expiredAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Points');
  }
};
