import { clearInterval } from "node:timers";
import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import { CommunityRepositoryImpl, ReminderRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import { type Channel, type ChannelManager, type Client, type Collection, type Snowflake, TextChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

// =============================================================================
// テスト用の定数
// =============================================================================
const TEST_GUILD_ID = "9999"; // communityのclientId（MockSlashCommandのデフォルト）
const TEST_USER_ID = "1234"; // userのclientId（MockSlashCommandのデフォルト）
const TEST_CHANNEL_ID = "5678"; // channelId（MockSlashCommandのデフォルト）

const FUTURE_DATETIME = "2999/12/31 23:59:59";
const PAST_DATETIME = "1000/12/31 23:59:59";
const FUTURE_DATETIME_FORMATTED = "3000-01-01 08:59:59"; // UTC+9で表示

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
	reminder: { id: number; userId: number | string; channelId: string; message: string },
	expected: { id?: number; userId: number | string; channelId: string; message: string },
): void {
	if (expected.id !== undefined) {
		expect(reminder.id).to.eq(expected.id);
	}
	expect(String(reminder.userId)).to.eq(String(expected.userId));
	expect(String(reminder.channelId)).to.eq(String(expected.channelId));
	expect(reminder.message).to.eq(expected.message);
}

/**
 * ReminderNotifyHandler用のDiscord Clientモックを作成する
 */
function createClientMockForNotifyHandler(channelMock: TextChannel): Client {
	const mockedChannel = channelMock;
	Object.setPrototypeOf(mockedChannel, TextChannel.prototype);

	const cacheMock = mock<Collection<Snowflake, Channel>>();
	when(cacheMock.get(anything())).thenReturn(mockedChannel);

	const channelManagerMock = mock<ChannelManager>();
	when(channelManagerMock.cache).thenReturn(instance(cacheMock));

	const clientMock = mock<Client>();
	when(clientMock.channels).thenReturn(instance(channelManagerMock));

	return instance(clientMock);
}

/**
 * 指定時間内にメソッドが呼ばれるまでポーリングして待機する
 */
async function waitForMethodCall(verifyFn: () => void, timeoutMs = 500, intervalMs = 100): Promise<void> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		const timer = setInterval(() => {
			try {
				verifyFn();
				clearInterval(timer);
				resolve();
			} catch (_) {
				if (Date.now() - startTime > timeoutMs) {
					clearInterval(timer);
					reject(new Error("Timeout: Method was not called within the time limit."));
				}
			}
		}, intervalMs);
	});
}

/**
 * テスト用リマインダーデータを作成する
 */
interface ReminderTestDataInput {
	communityId: number;
	userId: number | string;
	channelId: string;
	receiveUserName: string;
	message: string;
	remindAt: string | dayjs.Dayjs;
}

function createReminderTestData(
	communityId: number,
	userId: number | string,
	overrides: Partial<Omit<ReminderTestDataInput, "communityId" | "userId">> = {},
): Record<string, unknown> {
	return {
		communityId,
		userId,
		channelId: TEST_CHANNEL_ID,
		receiveUserName: "username",
		message: "test reminder",
		remindAt: FUTURE_DATETIME,
		...overrides,
	};
}

// =============================================================================
// テスト本体
// =============================================================================
describe("Test Reminder Commands", () => {
	let testCommunityId: number;
	let testUserId: number;

	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
	beforeEach(async () => {
		new MysqlConnector();

		// 既存レコードのクリーンアップ
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
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
	});

	afterEach(async () => {
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
	});

	// =========================================================================
	// ReminderSetCommandHandler のテスト
	// =========================================================================
	describe("ReminderSetCommandHandler", () => {
		/**
		 * [正常系] リマインダーを正常に設定できる
		 */
		it("should set reminder successfully with valid datetime and message", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: FUTURE_DATETIME,
				message: "test reminder",
			});

			verify(commandMock.reply("リマインドの投稿を予約したよ！っ")).once();

			const reminders = await ReminderRepositoryImpl.findAll();
			expect(reminders.length).to.eq(1);

			verifyReminderData(reminders[0], {
				userId: testUserId,
				channelId: TEST_CHANNEL_ID,
				message: "test reminder",
			});
			expect(reminders[0].communityId).to.eq(testCommunityId);
		});

		/**
		 * [日時検証] 過去の日時ではリマインダーを設定できない
		 */
		it("should reject reminder with past datetime", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: PAST_DATETIME,
				message: "test reminder",
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("過去の日付のリマインドは設定できないよ！っ")).once();
		});

		/**
		 * [パラメータ検証] ユーザー名がnullの場合はエラーになる
		 */
		it("should return error when username is null", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: null,
				datetime: FUTURE_DATETIME,
				message: "test reminder",
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [パラメータ検証] 日時がnullの場合はエラーになる
		 */
		it("should return error when datetime is null", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: null,
				message: "test reminder",
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [パラメータ検証] メッセージがnullの場合はエラーになる
		 */
		it("should return error when message is null", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: FUTURE_DATETIME,
				message: null,
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});

	// =========================================================================
	// ReminderListCommandHandler のテスト
	// =========================================================================
	describe("ReminderListCommandHandler", () => {
		/**
		 * [リスト表示] リマインダーが登録されていない場合はその旨を表示する
		 */
		it("should show message when no reminders exist", async () => {
			const commandMock = await executeCommand("reminderlist");

			verify(commandMock.reply("リマインドは予約されていないよ！っ")).once();
		});

		/**
		 * [リスト表示] 登録されているリマインダーの一覧が表示される
		 */
		it("should display formatted list of registered reminders", async () => {
			await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, testUserId, { message: "reminderlist test 1" }),
				createReminderTestData(testCommunityId, testUserId, { message: "reminderlist test 2" }),
			]);

			const commandMock = mockSlashCommand("reminderlist");
			let capturedReply = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				capturedReply = args;
			});

			const client = await TestDiscordServer.getClient();
			client.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply("リマインドは予約されていないよ！っ")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();

			const expectedOutput =
				`- id: 1\n  - ${FUTURE_DATETIME_FORMATTED}\n  - reminderlist test 1\n` + `- id: 2\n  - ${FUTURE_DATETIME_FORMATTED}\n  - reminderlist test 2`;
			expect(capturedReply).to.eq(expectedOutput);
		});
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
				createReminderTestData(testCommunityId, testUserId, { message: "reminderlist test 1" }),
				createReminderTestData(testCommunityId, testUserId, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, 9012, {
					channelId: "3456",
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
				channelId: String(forNotDelete1.channelId),
				message: forNotDelete1.message,
			});
			verifyReminderData(remainingReminders[1], {
				id: forNotDelete2.id,
				userId: forNotDelete2.userId,
				channelId: String(forNotDelete2.channelId),
				message: forNotDelete2.message,
			});
		});

		/**
		 * [ユーザー検証] 他のユーザーのリマインダーは削除できない
		 */
		it("should not delete reminder owned by another user", async () => {
			const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, 9012, { message: "reminderlist test 1" }),
				createReminderTestData(testCommunityId, testUserId, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, 9012, {
					channelId: "3456",
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
					channelId: String(expected.channelId),
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

	// =========================================================================
	// ReminderNotifyHandler のテスト
	// =========================================================================
	describe("ReminderNotifyHandler", () => {
		/**
		 * [リマインダー通知] 指定時刻に達したリマインダーが通知される
		 */
		it("should notify and delete reminders when remind time has passed", async () => {
			const [_, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, "9012", {
					message: "reminderlist test 1",
					remindAt: dayjs().subtract(1, "second"),
				}),
				createReminderTestData(testCommunityId, TEST_USER_ID, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, "9012", {
					channelId: "3456",
					message: "reminderlist test 3",
				}),
			]);

			const channelMock = mock<TextChannel>();
			when(channelMock.send(anything())).thenCall(() => {});
			const clientMock = createClientMockForNotifyHandler(instance(channelMock));

			await ReminderNotifyHandler(clientMock);

			await waitForMethodCall(() => {
				verify(channelMock.send(anything())).atLeast(1);
			});

			const remainingReminders = await ReminderRepositoryImpl.findAll();
			expect(remainingReminders.length).to.eq(2);

			verifyReminderData(remainingReminders[0], {
				id: inserted1.id,
				userId: inserted1.userId,
				channelId: String(inserted1.channelId),
				message: inserted1.message,
			});
			verifyReminderData(remainingReminders[1], {
				id: inserted2.id,
				userId: inserted2.userId,
				channelId: String(inserted2.channelId),
				message: inserted2.message,
			});
		});

		/**
		 * [リマインダー通知] リマインダーが登録されていない場合は何も送信されない
		 */
		it("should not send any message when no reminders exist", async () => {
			const channelMock = mock<TextChannel>();
			const clientMock = createClientMockForNotifyHandler(instance(channelMock));

			await ReminderNotifyHandler(clientMock);

			try {
				await waitForMethodCall(() => {
					verify(channelMock.send(anything())).atLeast(1);
				});
				// ここに到達した場合はテスト失敗
				expect("expected not to reach here").to.be.false;
			} catch (_) {
				// タイムアウトが期待される動作
				verify(channelMock.send(anything())).never();
			}
		});

		/**
		 * [エラーハンドリング] 送信エラー時はリマインダーが削除されない
		 */
		it("should not delete reminder when send fails (rollback)", async () => {
			const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, "9012", {
					message: "reminderlist test 1",
					remindAt: dayjs().subtract(1, "second"),
				}),
				createReminderTestData(testCommunityId, TEST_USER_ID, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, "9012", {
					channelId: "3456",
					message: "reminderlist test 3",
				}),
			]);

			const channelMock = mock<TextChannel>();
			when(channelMock.send(anything())).thenThrow(new Error("mock error"));
			const clientMock = createClientMockForNotifyHandler(instance(channelMock));

			try {
				await ReminderNotifyHandler(clientMock);
			} catch (_) {
				// エラーは期待される動作
			}

			// 非同期操作の完了を待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// ロールバックによりリマインダーが削除されていないことを確認
			const reminders = await ReminderRepositoryImpl.findAll();
			expect(reminders.length).to.eq(3);

			[inserted0, inserted1, inserted2].forEach((expected, index) => {
				verifyReminderData(reminders[index], {
					id: expected.id,
					userId: expected.userId,
					channelId: String(expected.channelId),
					message: expected.message,
				});
			});
		});
	});
});
