import type { Datafix } from "@/migrator/umzug";
import { DatafixCandyModel } from "./models/DatafixCandyModel";

export const up: Datafix = async () => {
	try {
		await DatafixCandyModel.update(
			{
				communityId: 1,
			},
			{
				where: {
					communityId: null,
				},
			},
		)
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};

export const down: Datafix = async () => {
	try {
		await DatafixCandyModel.update(
			{
				communityId: null,
			},
			{
				where: {
					communityId: 1,
				},
			},
		);
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};
