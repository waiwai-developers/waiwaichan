import type { Datafix } from "@/migrator/umzug";
import { DatafixUserItemModel } from "./models/DatafixUserItemModel";

export const up: Datafix = async () => {
	try {
		await DatafixUserItemModel.update(
			{
				communityId: 1,
			},
			{
				where: {
					communityId: null,
				},
			},
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`migration failed: ${message}`);
		throw error;
	}
};

export const down: Datafix = async () => {
	try {
		await DatafixUserItemModel.update(
			{
				communityId: null,
			},
			{
				where: {
					communityId: 1,
				},
			},
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`migration failed: ${message}`);
		throw error;
	}
};
