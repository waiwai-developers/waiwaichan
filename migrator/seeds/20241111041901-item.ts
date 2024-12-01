import type { Seed } from "@/migrator/umzug";
import { Op } from "sequelize";
import { MigratePointItemModel } from "./models/MigratePointItemModel";
export const ITEM_RECORDS = [
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
	await new MigratePointItemModel().bulkUpsert(ITEM_RECORDS);
};

export const down: Seed = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().bulkDelete(
		"Items",
		{
			id: { [Op.in]: ITEM_RECORDS.map((r) => r.id) },
		},
		{},
	);
};
