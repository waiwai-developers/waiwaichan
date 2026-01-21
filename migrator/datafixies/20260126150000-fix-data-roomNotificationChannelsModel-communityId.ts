import type { Datafix } from "@/migrator/umzug";
import { DatafixRoomNotificationChannelsModel } from "./models/DatafixRoomNotificationChannelsModel";

export const up: Datafix = async () => {
	try {
		await DatafixRoomNotificationChannelsModel.update(
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
		await DatafixRoomNotificationChannelsModel.update(
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
