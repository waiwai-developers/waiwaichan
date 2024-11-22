import type { Seed } from "@/migrator/umzug";
import { MigratePointItemModel } from "./models/MigratePointItemModel";
export const up: Seed = async ({ context: sequelize }) => {
	await new MigratePointItemModel().bulkFindOrCreate([
		{
			id: 1,
			name: "waiwaiオリジナルTシャツ",
			description: "UTmeで作った2000円くらいのTシャツ",
		},
		{
			id: 2,
			name: "お菓子",
			description: "コンビニで買える100円くらいお菓子",
		},
	]);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete("Items", {}, {});
};
