import type { Datafix } from "@/migrator/umzug";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";
import { DatafixCandyModel } from "./models/DatafixCandyModel";
import { Op, col } from "sequelize";

export const up: Datafix = async () => {
	const userItems = await DatafixUserItemModel.findAll();
	let candyIds: number[] = []

	for (const ui of userItems) {
	    await DatafixCandyModel.findOne(
			{
				where: {
					id: { [Op.notIn]: candyIds },
					receiveUserId: ui.userId,
					createdAt: {
						[Op.lte]: ui.createdAt,
					},
				},
				order: [[col("createdAt"), "DESC"]],
			}
		).then(async (c) => {
			if (!c) {return}
			await ui.update({ candyId: c.id })
			candyIds.push(c.id)
		})
	}
};

