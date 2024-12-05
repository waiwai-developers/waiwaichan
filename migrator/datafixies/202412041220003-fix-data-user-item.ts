import type { Datafix } from "@/migrator/umzug";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";

export const up: Datafix = async () => {
	const userItems = await DatafixUserItemModel.findAll({
		where: {
			status: 1,
		},
	});
	await Promise.all(
		userItems.map(async (item) => {
			return item.update({
				updatedAt: item.updatedAt,
				deletedAt: item.updatedAt,
			});
		}),
	);
};
