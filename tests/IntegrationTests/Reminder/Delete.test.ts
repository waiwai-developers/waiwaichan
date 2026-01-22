import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ChannelRepositoryImpl, CommunityRepositoryImpl, ReminderRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, verify } from "ts-mockito";

// =============================================================================
// テスト用の定数
// =============================================================================
const TEST_GUILD_ID = "9999"; // communityのclientId（MockSlashCommandのデフォルト）
const TEST_USER_ID = "1234"; // userのclientId（MockSlashCommandのデフォルト）
const TEST_CHANNEL_CLIENT_ID = "5678"; // channelのclientId（MockSlashCommandのデフォルト）

const FUTURE_DATETIME = "2999/12/31 23:59:59";

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * スラッシュコマンドを実行してリプライを待機する
 */
async function executeCommand<T extends Record<string, unknown>>(commandName: string, options?: T): Promise<ReturnType<typeof mockSlashCommand>> {
	const commandMock = mockSlashCommand(commandName, options);
	const client = await TestDiscordServer.getClient();
	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
	return commandMock;
}

/**
 * リマインダーデータの検証を行う
 */
function verifyReminderData(
	reminder: { id: number; userId: number | string; channelId: number; message: string },
	expected: { id?: number; userId: number | string; channelId: number; message: string },
): void {
	if (expected.id !== undefined) {
		expect(reminder.id).to.eq(expected.id);
	}
	expect(String(reminder.userId)).to.eq(String(expected.userId));
	expect(reminder.channelId).to.eq(expected.channelId);
	expect(reminder.message).to.eq(expected.message);
}

/**
 * テスト用リマインダーデータを作成する
 */
function createReminderTestData(
	communityId: number,
	userId: number | string,
	channelId: number,
	overrides: Partial<{ receiveUserName: string; message: string; remindAt: string }> = {},
): Record<string, unknown> {
	return {
		communityId,
		userId,
		channelId,
		receiveUserName: "username",
		message: "test reminder",
		remindAt: FUTURE_DATETIME,
		...overrides,
	};
}

// =============================================================================
// テスト本体
// =============================================================================
describe("Test ReminderDeleteCommandHandler", () => {
	let testCommunityId: number;
	let testUserId: number;
	let testChannelId: number;

	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
	beforeEach(async () => {
		new MysqlConnector();

		// 既存レコードのクリーンアップ
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });

		// テスト用コミュニティ作成
		const community = await CommunityRepositoryImpl.create({
			categoryType: 0,
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});
		testCommunityId = community.id;

		// テスト用ユーザー作成
		const user = await UserRepositoryImpl.create({
			categoryType: 0,
			clientId: BigInt(TEST_USER_ID),
			userType: 0,
			communityId: community.id,
			batchStatus: 0,
		});
		testUserId = user.id;

		// テスト用チャンネル作成
		const channel = await ChannelRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: BigInt(TEST_CHANNEL_CLIENT_ID),
			channelType: 2, // DiscordText
			communityId: community.id,
			batchStatus: 0,
		});
		testChannelId = channel.id;
	});

	afterEach(async () => {
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
	});

	// =========================================================================
	// ReminderDeleteCommandHandler のテスト
	// =========================================================================
	describe("ReminderDeleteCommandHandler", () => {
		/**
		 * [正常系] 存在するリマインダーを削除できる
		 */
		it("should delete existing reminder successfully", async () => {
			const [forDelete, forNotDelete1, forNotDelete2] = await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, testUserId, testChannelId, { message: "reminderlist test 1" }),
				createReminderTestData(testCommunityId, testUserId, testChannelId, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, 9012, 3456, {
					message: "reminderlist test 3",
					remindAt: "2000/12/31 23:59:59",
				}),
			]);

			const commandMock = await executeCommand("reminderdelete", { id: forDelete.id });

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("リマインドの予約を削除したよ！っ")).once();

			const remainingReminders = await ReminderRepositoryImpl.findAll();
			expect(remainingReminders.length).to.eq(2);

			verifyReminderData(remainingReminders[0], {
				id: forNotDelete1.id,
				userId: forNotDelete1.userId,
				channelId: forNotDelete1.channelId,
				message: forNotDelete1.message,
			});
			verifyReminderData(remainingReminders[1], {
				id: forNotDelete2.id,
				userId: forNotDelete2.userId,
				channelId: forNotDelete2.channelId,
				message: forNotDelete2.message,
			});
		});

		/**
		 * [ユーザー検証] 他のユーザーのリマインダーは削除できない
		 */
		it("should not delete reminder owned by another user", async () => {
			const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, 9012, testChannelId, { message: "reminderlist test 1" }),
				createReminderTestData(testCommunityId, testUserId, testChannelId, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, 9012, 3456, {
					message: "reminderlist test 3",
					remindAt: "2000/12/31 23:59:59",
				}),
			]);

			const commandMock = await executeCommand("reminderdelete", { id: inserted0.id });

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("リマインドの予約はされていなかったよ！っ")).once();

			const reminders = await ReminderRepositoryImpl.findAll();
			expect(reminders.length).to.eq(3);

			// 全てのリマインダーが残っていることを確認
			[inserted0, inserted1, inserted2].forEach((expected, index) => {
				verifyReminderData(reminders[index], {
					id: expected.id,
					userId: expected.userId,
					channelId: expected.channelId,
					message: expected.message,
				});
			});
		});

		/**
		 * [存在チェック] 存在しないリマインダーは削除できない
		 */
		it("should return error message when reminder does not exist", async () => {
			const commandMock = await executeCommand("reminderdelete", { id: 0 });

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("リマインドの予約はされていなかったよ！っ")).once();
		});

		/**
		 * [パラメータ検証] IDがnullの場合はエラーになる
		 */
		it("should return error when id is null", async () => {
			const commandMock = await executeCommand("reminderdelete", { id: null });

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});
});
