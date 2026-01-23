import { clearInterval } from "node:timers";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import { ChannelRepositoryImpl, CommunityRepositoryImpl, ReminderRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { expect } from "chai";
import dayjs from "dayjs";
import { type Channel, type ChannelManager, type Client, type Collection, type Snowflake, TextChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

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
function createReminderTestData(
	communityId: number,
	userId: number | string,
	channelId: number,
	overrides: Partial<{ receiveUserName: string; message: string; remindAt: string | dayjs.Dayjs }> = {},
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
describe("Test ReminderNotifyHandler", () => {
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
	// ReminderNotifyHandler のテスト
	// =========================================================================
	describe("ReminderNotifyHandler", () => {
		/**
		 * [リマインダー通知] 指定時刻に達したリマインダーが通知される
		 */
		it("should notify and delete reminders when remind time has passed", async () => {
			const [_, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, "9012", testChannelId, {
					message: "reminderlist test 1",
					remindAt: dayjs().subtract(1, "second"),
				}),
				createReminderTestData(testCommunityId, TEST_USER_ID, testChannelId, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, "9012", 3456, {
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
				channelId: inserted1.channelId,
				message: inserted1.message,
			});
			verifyReminderData(remainingReminders[1], {
				id: inserted2.id,
				userId: inserted2.userId,
				channelId: inserted2.channelId,
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
				createReminderTestData(testCommunityId, "9012", testChannelId, {
					message: "reminderlist test 1",
					remindAt: dayjs().subtract(1, "second"),
				}),
				createReminderTestData(testCommunityId, TEST_USER_ID, testChannelId, { message: "reminderlist test 2" }),
				createReminderTestData(testCommunityId, "9012", 3456, {
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
					channelId: expected.channelId,
					message: expected.message,
				});
			});
		});
	});
});
