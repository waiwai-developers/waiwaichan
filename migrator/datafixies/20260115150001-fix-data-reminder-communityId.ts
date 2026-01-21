import type { Datafix } from "@/migrator/umzug";
import { DatafixReminderModel } from "./models/DatafixReminderModel";

export const up: Datafix = async () => {
	try {
		await DatafixReminderModel.update(
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
		await DatafixReminderModel.update(
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
