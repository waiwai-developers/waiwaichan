"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			"Items",
			[
				{
					id: 1,
					name: "waiwaiオリジナルTシャツ",
					description: "UTmeで作った2000円くらいのTシャツ",
					createdAt: "2024-01-01 00:00:00",
					updatedAt: "2024-01-01 00:00:00",
				},
				{
					id: 2,
					name: "お菓子",
					description: "コンビニで買える100円くらいお菓子",
					createdAt: "2024-01-01 00:00:00",
					updatedAt: "2024-01-01 00:00:00",
				},
			],
			{},
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Items", null, {});
	},
};
