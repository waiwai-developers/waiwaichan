import type { Datafix } from "@/migrator/umzug";
import { DatafixRoomAddChannelsModel } from "./models/DatafixRoomAddChannelsModel";

export const up: Datafix = async () => {
	try {
		await DatafixRoomAddChannelsModel.update(
			{
				communityId: 1,
			},
			{
				where: {
					communityId: null,
				},
			},
		);
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};

export const down: Datafix = async () => {
	try {
		await DatafixRoomAddChannelsModel.update(
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
