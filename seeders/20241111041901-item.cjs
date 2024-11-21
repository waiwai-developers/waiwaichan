const getRecord = async (s) => {
	const existingData1 =
		(await s.query("SELECT id FROM Items WHERE id = 1"))[0].length > 0;
	const existingData2 =
		(await s.query("SELECT id FROM Items WHERE id = 2"))[0].length > 0;
	return [
		existingData1
			? null
			: {
					id: 1,
					name: "waiwaiオリジナルTシャツ",
					description: "UTmeで作った2000円くらいのTシャツ",
					createdAt: "2024-01-01 00:00:00",
					updatedAt: "2024-01-01 00:00:00",
				},
		existingData2
			? null
			: {
					id: 2,
					name: "お菓子",
					description: "コンビニで買える100円くらいお菓子",
					createdAt: "2024-01-01 00:00:00",
					updatedAt: "2024-01-01 00:00:00",
				},
	].filter((it) => it != null);
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const records = await getRecord(queryInterface.sequelize);
		if (records.length <= 0) {
			return;
		}
		await queryInterface.bulkInsert("Items", records, {});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Items", null, {});
	},
};
