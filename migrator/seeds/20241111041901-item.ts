import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { MigratePointItemModel } from "./models/MigratePointItemModel";
const records = [
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
];
export const up: Seed = async () => {
	await new MigratePointItemModel().bulkFindOrCreate(records);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"Items",
		{
			id: { [Op.in]: records.map((r) => r.id) },
		},
		{},
	);
};
