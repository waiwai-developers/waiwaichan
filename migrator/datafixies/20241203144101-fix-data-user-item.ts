import type { Datafix } from "@/migrator/umzug";
import dayjs from "dayjs";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";

export const up: Datafix = async () => {
	const datafixUserItemModel = new DatafixUserItemModel();
	const userItems = await datafixUserItemModel.findAll();
	const fixUserItems = userItems.map((u) => ({
		...u.dataValues,
		expiredAt: dayjs(u.dataValues.expiredAt)
			.add(1, "day")
			.startOf("day")
			.toDate(),
	}));
	await datafixUserItemModel.bulkUpsert(fixUserItems);
};
