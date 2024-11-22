import type { Seed } from "@/migrator/umzug";

export const up: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkInsert(
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
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete("Items", {}, {});
};
