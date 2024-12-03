import type { Datafix } from "@/migrator/umzug";
import dayjs from "dayjs";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";

export const up: Datafix = async () => {
	const userItems = await DatafixUserItemModel.findAll();
	await Promise.all(
		userItems.map(async (items) => {
			return items.update({
				expiredAt: dayjs(items.expiredAt).add(1, "day").startOf("day").toDate(),
			});
		}),
	);
};
