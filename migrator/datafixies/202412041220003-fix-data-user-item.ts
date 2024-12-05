import type { Datafix } from "@/migrator/umzug";
import dayjs from "dayjs";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";

export const up: Datafix = async ({ context: sequelize }) => {
	const userItems = await DatafixUserItemModel.findAll({
		where: {
			status: 1,
		},
	});
	await Promise.all(
		userItems.map(async (item) => {
			return sequelize.query(
				`UPDATE UserItems SET updatedAt = '${dayjs(item.updatedAt).format("YYYY-MM-DD hh:mm:ss")}', deletedAt = '${dayjs(item.updatedAt).format("YYYY-MM-DD hh:mm:ss")}' WHERE id = ${item.id}`,
			);
		}),
	);
};
