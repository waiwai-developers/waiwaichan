import { DatafixCandyModel } from "@/migrator/datafixies/models/DatafixCandyModel";
import { DatafixReminderModel } from "@/migrator/datafixies/models/DatafixReminderModel";
import { DatafixUserItemModel } from "@/migrator/datafixies/models/DatafixUserItemModel";
import { DatafixUserModel } from "@/migrator/datafixies/models/DatafixUserModel";
import type { Datafix } from "@/migrator/umzug";
import { Op, QueryTypes } from "sequelize";

/**
 * CandiesのuserId、giveUserId、UserItemsのuserId、RemindersのuserIdを収集し、
 * 重複を除いた上で、Usersテーブルに存在しないものをclientIdとして登録するクエリ
 * その後、各テーブルのuserIdまたはgiveUserIdをUsersテーブルのidに更新する
 */
export const up: Datafix = async ({ context: sequelize }) => {
	// ステップ1: すべてのuserIdを収集して重複を除き、Usersテーブルに新規レコードとして挿入
	console.log("Step 1: Collecting distinct user IDs...");

	// 各テーブルから重複を除いたuserIdを収集
	const distinctUserIds = await sequelize.query<{ userId: string }>(
		`
		SELECT DISTINCT userId FROM (
			SELECT userId FROM Candies WHERE userId IS NOT NULL
			UNION
			SELECT giveUserId AS userId FROM Candies WHERE giveUserId IS NOT NULL
			UNION
			SELECT userId FROM UserItems WHERE userId IS NOT NULL
			UNION
			SELECT userId FROM Reminders WHERE userId IS NOT NULL
		) AS distinct_user_ids
		WHERE NOT EXISTS (
			SELECT 1 FROM Users WHERE Users.id = distinct_user_ids.userId
		)
		`,
		{
			type: QueryTypes.SELECT,
		},
	);

	console.log(`Found ${distinctUserIds.length} unique user IDs to insert`);

	// 新しいユーザーを一括作成
	if (distinctUserIds.length > 0) {
		const now = new Date();
		const usersToCreate = distinctUserIds.map((row) => ({
			categoryType: 0,
			clientId: BigInt(row.userId),
			userType: 0,
			communityId: 1,
			batchStatus: 0,
			createdAt: now,
			updatedAt: now,
			deletedAt: now,
		}));

		await DatafixUserModel.bulkCreate(usersToCreate);
		console.log(`Inserted ${usersToCreate.length} new users`);
	}

	// ステップ2: CandiesテーブルのuserIdをUsersテーブルのidに更新
	console.log("Step 2: Updating Candies.userId...");
	const candiesWithUserId = await DatafixCandyModel.findAll({
		where: {
			userId: {
				[Op.ne]: null,
			},
		},
	});

	for (const candy of candiesWithUserId) {
		const user = await DatafixUserModel.findOne({
			where: { clientId: candy.userId },
		});
		if (user) {
			await candy.update({ userId: user.id });
		}
	}
	console.log(`Updated ${candiesWithUserId.length} Candies.userId records`);

	// ステップ3: CandiesテーブルのgiveUserIdをUsersテーブルのidに更新
	console.log("Step 3: Updating Candies.giveUserId...");
	const candiesWithGiveUserId = await DatafixCandyModel.findAll({
		where: {
			giveUserId: {
				[Op.ne]: null,
			},
		},
	});

	for (const candy of candiesWithGiveUserId) {
		const user = await DatafixUserModel.findOne({
			where: { clientId: candy.giveUserId },
		});
		if (user) {
			await candy.update({ giveUserId: user.id });
		}
	}
	console.log(
		`Updated ${candiesWithGiveUserId.length} Candies.giveUserId records`,
	);

	// ステップ4: UserItemsテーブルのuserIdをUsersテーブルのidに更新
	console.log("Step 4: Updating UserItems.userId...");
	const userItems = await DatafixUserItemModel.findAll({
		where: {
			userId: {
				[Op.ne]: null,
			},
		},
	});

	for (const userItem of userItems) {
		const user = await DatafixUserModel.findOne({
			where: { clientId: userItem.userId },
		});
		if (user) {
			await userItem.update({ userId: user.id });
		}
	}
	console.log(`Updated ${userItems.length} UserItems.userId records`);

	// ステップ5: RemindersテーブルのuserIdをUsersテーブルのidに更新
	console.log("Step 5: Updating Reminders.userId...");
	const reminders = await DatafixReminderModel.findAll({
		where: {
			userId: {
				[Op.ne]: null,
			},
		},
	});

	for (const reminder of reminders) {
		const user = await DatafixUserModel.findOne({
			where: { clientId: BigInt(reminder.userId) },
		});
		if (user) {
			await reminder.update({ userId: String(user.id) });
		}
	}
	console.log(`Updated ${reminders.length} Reminders.userId records`);

	console.log("Data fix completed successfully!");
};

export const down: Datafix = async ({ context: sequelize }) => {
	console.log(
		"This data fix cannot be automatically reverted. Manual intervention required.",
	);
	// downはデータの復元が複雑なため、実装しない
	// 必要に応じてバックアップから復元する
};
