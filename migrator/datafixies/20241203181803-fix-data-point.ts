import type { Datafix } from "@/migrator/umzug";
import dayjs from "dayjs";
import { DatafixPointModel } from "./models/DatafixPointModel";

export const up: Datafix = async () => {
	const points = await DatafixPointModel.findAll();
	await Promise.all(
		points.map((p) => {
			p.update({
				expiredAt: dayjs(p.expiredAt).add(1, "day").startOf("day").toDate(),
			});
		}),
	);
};
