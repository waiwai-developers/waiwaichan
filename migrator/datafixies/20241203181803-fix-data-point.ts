import type { Datafix } from "@/migrator/umzug";
import dayjs from "dayjs";
import { DatafixPointModel } from "./models/DatafixPointModel";

export const up: Datafix = async () => {
	const datafixPointModel = new DatafixPointModel();
	const points = await datafixPointModel.findAll();
	const fixUserItems = points.map((p) => ({
		...p.dataValues,
		expiredAt: dayjs(p.dataValues.expiredAt)
			.add(1, "day")
			.startOf("day")
			.toDate(),
	}));
	await datafixPointModel.bulkUpsert(fixUserItems);
};
