import type { Datafix } from "@/migrator/umzug";
import { DatafixReminderModel } from "./models/DatafixReminderModel";
import { DatafixUserModel } from "./models/DatafixUserModel";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";


// for (const community of communities) {
// 	try {
// 		console.log(`processing community guild: ${community.clientId}`);
// 		const guild = await client.guilds.fetch(community.clientId);
// 		const members = await guild.members.fetch();

// 		await DatafixUserModel.bulkCreate(
// 			members.map((m) => ({
// 				categoryType: UserCategoryType.Discord.getValue(),
// 				clientId: BigInt(m.id),
// 				communityId: community.id,
// 				batchStatus: UserBatchStatus.Yet.getValue()
// 			}))
// 		);
// 		console.log(`successfully created ${members.size} users for community guildId: ${community.clientId}`);
// 	} catch (error: any) {
// 		console.error(`error processing community guildId: ${community.clientId}: ${error.message}`);
// 		continue;
// 	}


export const up: Datafix = async () => {
	try {
		const reminders = await DatafixReminderModel.findAll()
		for (const r of reminders) {
			const user = await DatafixUserModel.findOne({
				where: {
					categoryType: UserCategoryType.Discord.getValue(),
					clientId: r.userId,
					communityId: 1
				}
			})
			if ( user == null) { continue; }
			await DatafixReminderModel.update(
				{
					userId: user.id,
				},
				{
					where: {
						id: r.id,
					},
				},
			)
		}
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};
