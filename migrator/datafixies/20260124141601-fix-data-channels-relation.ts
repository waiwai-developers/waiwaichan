import { DatafixRoomChannelsModel } from "@/migrator/datafixies/models/DatafixRoomChannelsModel";
import type { Datafix } from "@/migrator/umzug";
import { Op } from "sequelize";

/**
 * RoomChannelsテーブルからchannelIdがnullのレコードを削除する
 */
export const up: Datafix = async ({ context: sequelize }) => {
	console.log("Deleting RoomChannels records where channelId is null...");

	// channelIdがnullのレコードを削除
	const deletedCount = await DatafixRoomChannelsModel.destroy({
		where: {
			channelId: {
				[Op.is]: null,
			},
		},
	});

	console.log(`Deleted ${deletedCount} records from RoomChannels table`);
	console.log("Data fix completed successfully!");
};

export const down: Datafix = async ({ context: sequelize }) => {
	console.log(
		"This data fix cannot be automatically reverted. Deleted records cannot be restored.",
	);
	// 削除したデータは復元できないため、downは実装しない
};
