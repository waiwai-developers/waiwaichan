import type { Datafix } from "@/migrator/umzug";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";
import { DatafixCandyModel } from "./models/DatafixCandyModel";
import { Op, col } from "sequelize";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";

export const up: Datafix = async () => {
	const transaction :ITransaction = new SequelizeTransaction();
	return transaction.startTransaction(async () => {
		const userItems = await DatafixUserItemModel.findAll();
		let candyIds: number[] = []

		for (const ui of userItems) {
			await DatafixCandyModel.findOne(
				{
					where: {
						id: { [Op.notIn]: candyIds },
						receiveUserId: ui.userId,
						deletedAt: {
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
		return Promise.resolve();
	});
};
