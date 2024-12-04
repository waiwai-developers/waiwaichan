import type { Datafix } from "@/migrator/umzug";
import { DatafixPointModel } from "./models/DatafixPointModel";

export const up: Datafix = async () => {
	const points = await DatafixPointModel.findAll({
		where: {
			status: 1,
		},
	});
	await Promise.all(
		points.map((point) => {
			point.update({
				deletedAt: point.updatedAt,
			});
		}),
	);
};
