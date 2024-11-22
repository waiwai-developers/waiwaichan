import type { Seed } from "@/migrator/umzug";
import type { Sequelize } from "sequelize";

const getRecord = async (s: Sequelize) => {
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

const up: Seed = async ({ context: sequelize }) => {
	const records = await getRecord(sequelize);
	if (records.length <= 0) {
		return;
	}
	await sequelize.getQueryInterface().bulkInsert("Items", records, {});
};

const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete("Items", {}, {});
};
