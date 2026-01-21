import type { Datafix } from "@/migrator/umzug";
import { DatafixRoomChannelsModel } from "./models/DatafixRoomChannelsModel";

export const up: Datafix = async () => {
	try {
		await DatafixRoomChannelsModel.update(
			{
				communityId: 1,
			},
			{
				where: {
					communityId: null,
				},
			},
		);
	} catch (error: unknown) {
		console.error(
			`migration failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
};

export const down: Datafix = async () => {
	try {
		await DatafixRoomChannelsModel.update(
			{
				communityId: null,
			},
			{
				where: {
					communityId: 1,
				},
			},
		);
	} catch (error: unknown) {
		console.error(
			`migration failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
};
