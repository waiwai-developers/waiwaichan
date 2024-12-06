import type { Datafix } from "@/migrator/umzug";
import dayjs from "dayjs";
import { DatafixPointModel } from "./models/DatafixPointModel";

export const up: Datafix = async ({ context: sequelize }) => {
	const points = await DatafixPointModel.findAll({
		where: {
			status: 1,
		},
	});
	await Promise.all(
		points.map((point) => {
			return sequelize.query(
				`UPDATE Points SET updatedAt = '${dayjs(point.updatedAt).format("YYYY-MM-DD hh:mm:ss")}', deletedAt = '${dayjs(point.updatedAt).format("YYYY-MM-DD hh:mm:ss")}' WHERE id = ${point.id}`,
			);
		}),
	);
};
