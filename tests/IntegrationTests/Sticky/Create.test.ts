import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { ChannelRepositoryImpl, CommunityRepositoryImpl, StickyRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import type { InteractionResponse, Message } from "discord.js";
import { ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";

// テスト用の定数
const TEST_GUILD_ID = "1234567890"; // communityのclientId
const TEST_USER_ID = "1234"; // userのclientId

// ============================================
// 型定義
// ============================================

/** 返り値キャプチャオブジェクト */
interface ReplyCapture {
	getValue: () => string;
}

/** スティッキーの期待データ */
interface ExpectedStickyData {
	userId?: number;
	messageId?: string;
	message?: string;
}

/** モックメッセージの設定オプション */
interface MockMessageOptions {
	deleteResult?: boolean;
	onDelete?: () => void;
	onEdit?: (newContent: string) => void;
}

/** イベントテスト用オプション */
interface EventMessageMockOptions {
	isBot?: boolean;
	isThread?: boolean;
}

/** モックメッセージオブジェクト */
interface MockDiscordMessage {
	id: string;
	content: string;
	delete: () => Promise<boolean>;
	edit: (newContent: string) => Promise<{ id: string; content: string }>;
}

// ============================================
// モックファクトリ関数
// ============================================

/**
 * RoleConfigのモック設定
 * @param userId ユーザーID
 * @param role ロール ('admin' | 'user')
 */
function setupRoleConfig(userId: string, role: "admin" | "user"): void {
	RoleConfig.users = [{ discordId: userId, role }];
}

/**
 * replyメソッドのモックを設定し、返り値をキャプチャする
 * @param commandMock コマンドモック
 * @returns キャプチャされた返り値を取得するオブジェクト
 */
function setupReplyCapture(commandMock: ReturnType<typeof mockSlashCommand>): ReplyCapture {
	let replyValue = "";
	when(commandMock.reply(anything())).thenCall((message: string) => {
		replyValue = message;
		return Promise.resolve({} as InteractionResponse);
	});
	return { getValue: () => replyValue };
}


/**
 * メッセージのモックを作成
 * @param messageId メッセージID
 * @param content メッセージ内容
 * @param options オプション設定
 */
function createMessageMock(
	messageId: string,
	content: string,
	options: MockMessageOptions = {},
): MockDiscordMessage {
	const messageMock: MockDiscordMessage = {
		id: messageId,
		content,
		delete: () => {
			options.onDelete?.();
			return Promise.resolve(options.deleteResult ?? true);
		},
		edit: (newContent: string) => {
			options.onEdit?.(newContent);
			messageMock.content = newContent;
			return Promise.resolve({ id: messageId, content: newContent });
		},
	};
	return messageMock;
}

/**
 * コマンドの基本設定を行う（guildId, channel）
 * @param commandMock コマンドモック
 * @param guildId ギルドID
 */
function setupCommandBasics(commandMock: ReturnType<typeof mockSlashCommand>, guildId: string): void {
	when(commandMock.guildId).thenReturn(guildId);
	when(commandMock.channel).thenReturn({} as any);
}

// ============================================
// テストデータ作成ヘルパー
// ============================================

/**
 * Community と User を作成するヘルパー関数
 */
async function createCommunityAndUser(): Promise<{
	communityId: number;
	userId: number;
}> {
	// Create community
	const community = await CommunityRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	// Create user
	const user = await UserRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_USER_ID),
		userType: 0, // user
		communityId: community.id,
		batchStatus: 0,
	});

	return {
		communityId: community.id,
		userId: user.id,
	};
}

/**
 * テスト用Channelを作成するヘルパー関数
 * @param communityId コミュニティID
 * @param channelClientId チャンネルのクライアントID（Discord上のチャンネルID）
 * @returns 作成されたチャンネルのID
 */
async function createTestChannel(
	communityId: number,
	channelClientId: string,
): Promise<number> {
	const channel = await ChannelRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(channelClientId),
		channelType: 2, // DiscordText
		communityId: communityId,
		batchStatus: 0,
	});
	return channel.id;
}

/**
 * テスト用スティッキーを作成するヘルパー関数
 */
async function createTestSticky(
	communityId: number,
	userId: number,
	channelId: string,
	messageId: string,
	message: string,
): Promise<void> {
	await StickyRepositoryImpl.create({
		communityId,
		channelId,
		userId,
		messageId,
		message,
	});
}

// ============================================
// イベントテスト用ヘルパー関数
// ============================================

/**
 * イベントテスト用のメッセージモックを設定
 * @param userId ユーザーID
 * @param guildId ギルドID
 * @param channelId チャンネルID
 * @param options オプション設定
 */
function setupEventMessageMock(
	userId: string,
	guildId: string,
	channelId: string,
	options: EventMessageMockOptions = {},
): ReturnType<typeof mockMessage> {
	const messageMock = mockMessage(userId, false, options.isBot ?? false);

	// guildIdとchannelIdを設定
	when(messageMock.guildId).thenReturn(guildId);
	when(messageMock.channelId).thenReturn(channelId);

	// チャンネルをモック
	const channelMock = mock<TextChannel>();
	when(channelMock.isThread()).thenReturn(options.isThread ?? false);
	when(messageMock.channel).thenReturn(instance(channelMock));

	return messageMock;
}

/**
 * イベントテスト用のguildモックを設定（チャンネルキャッシュ付き）
 * @param messageMock メッセージモック
 * @param channelId チャンネルID
 * @param channel チャンネルオブジェクト（undefined=存在しない, {}=非TextChannel, TextChannel=TextChannel）
 */
function setupEventGuildMock(
	messageMock: ReturnType<typeof mockMessage>,
	channelId: string,
	channel: any,
): void {
	const guildMock = {
		channels: {
			cache: {
				get: (id: string) => (id === channelId ? channel : undefined),
			},
		},
	};
	when(messageMock.guild).thenReturn(guildMock as any);
}

/**
 * イベントテスト用のTextChannelモックを作成
 * @param channelId チャンネルID
 * @param oldMessage 古いメッセージモック
 * @param newMessage 新しいメッセージモック（sendの戻り値）
 */
function createEventTextChannelMock(
	channelId: string,
	oldMessage: any,
	newMessage: any,
): TextChannel {
	const textChannel = Object.create(TextChannel.prototype);
	textChannel.id = channelId;
	textChannel.type = 0;
	textChannel.send = () => Promise.resolve(newMessage);
	textChannel.messages = { fetch: () => Promise.resolve(oldMessage) };
	return textChannel;
}

/**
 * messageCreateイベントを発火して待つ
 * @param messageMock メッセージモック
 * @param waitMs 待機時間（ミリ秒）
 */
async function emitMessageCreateAndWait(
	messageMock: ReturnType<typeof mockMessage>,
	waitMs = 100,
): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("messageCreate", instance(messageMock));
	await new Promise((resolve) => setTimeout(resolve, waitMs));
}

// ============================================
// Repository検証ヘルパー関数
// ============================================

/**
 * スティッキーの件数を検証
 * @param expectedCount 期待されるスティッキーの件数
 */
async function expectStickyCount(expectedCount: number): Promise<void> {
	const stickies = await StickyRepositoryImpl.findAll();
	expect(stickies.length).to.eq(expectedCount);
}

/**
 * スティッキーが存在しないことを検証
 */
async function expectNoStickies(): Promise<void> {
	await expectStickyCount(0);
}

/**
 * 特定のスティッキーが存在し、データが正しいことを検証
 * @param communityId コミュニティID
 * @param channelId チャンネルID
 * @param expectedData 期待されるデータ（オプション）
 */
async function expectStickyExists(
	communityId: number,
	channelId: string,
	expectedData?: ExpectedStickyData,
): Promise<void> {
	const sticky = await StickyRepositoryImpl.findOne({
		where: { communityId, channelId },
	});
	expect(sticky).to.not.be.null;

	if (expectedData) {
		if (expectedData.userId !== undefined) {
			expect(String(sticky?.userId)).to.eq(String(expectedData.userId));
		}
		if (expectedData.messageId !== undefined) {
			expect(String(sticky?.messageId)).to.eq(String(expectedData.messageId));
		}
		if (expectedData.message !== undefined) {
			expect(sticky?.message).to.eq(expectedData.message);
		}
	}
}

/**
 * スティッキーのmessageIdが変更されていないことを検証
 * @param communityId コミュニティID
 * @param channelId チャンネルID
 * @param expectedMessageId 期待されるメッセージID
 */
async function expectStickyMessageIdUnchanged(
	communityId: number,
	channelId: string,
	expectedMessageId: string,
): Promise<void> {
	await expectStickyExists(communityId, channelId, { messageId: expectedMessageId });
}

/**
 * スティッキーのmessageIdが更新されたことを検証
 * @param communityId コミュニティID
 * @param channelId チャンネルID
 * @param expectedNewMessageId 期待される新しいメッセージID
 */
async function expectStickyMessageIdUpdated(
	communityId: number,
	channelId: string,
	expectedNewMessageId: string,
): Promise<void> {
	await expectStickyExists(communityId, channelId, { messageId: expectedNewMessageId });
}

describe("Test Sticky Commands", () => {
	// テスト用のコミュニティとユーザーのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;

	beforeEach(async () => {
		new MysqlConnector();
		// Clean up existing records
		await StickyRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
		// Create community and user for each test
		const { communityId, userId } = await createCommunityAndUser();
		testCommunityId = communityId;
		testUserId = userId;
	});

	afterEach(async () => {
		await StickyRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});

	/**
	 * StickyCreateCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合はスティッキーを作成できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - StickyLogicのcreateメソッドが呼ばれないことを検証
	 */
	it("should not create sticky when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 非管理者ユーザーIDを設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

			// RoleConfigのモック
			setupRoleConfig(userId, "user");

			// guildIdとchannelを設定
			setupCommandBasics(commandMock, guildId);

			// replyメソッドをモック
			const replyCapture = setupReplyCapture(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyCapture.getValue()).to.eq("スティッキーを登録する権限を持っていないよ！っ");

			// Stickyにデータが作られていないことを確認
			await expectNoStickies();
		})();
	});

	/**
	 * [既存チェック] 既にスティッキーが登録されているチャンネルには新規作成できない
	 * - StickyLogic.findが呼ばれることを検証
	 * - スティッキーが既に存在する場合にエラーメッセージが返されることを検証
	 * - StickyLogic.createが呼ばれないことを検証
	 */
	it("should not create sticky when channel already has a sticky", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック
			setupRoleConfig(TEST_USER_ID, "admin");

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// 既存のスティッキーを作成（DBのchannel.idを使用）
			await createTestSticky(testCommunityId, testUserId, String(dbChannelId), messageId, message);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			setupCommandBasics(commandMock, TEST_GUILD_ID);

			// guildのモックを設定（TextChannelを返す）
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0;
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			const replyCapture = setupReplyCapture(commandMock);

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 2000);

			// 応答の検証
			expect(replyCapture.getValue()).to.eq("スティッキーが既にチャンネルに登録されているよ！っ");

			// Stickyにデータが作られていないことを確認（件数チェック + 詳細検証）
			await expectStickyCount(1);
			await expectStickyExists(testCommunityId, String(dbChannelId), {
				userId: testUserId,
				messageId,
				message,
			});
		})();
	});
	/**
	 * [チャンネル検証] TextChannel以外にはスティッキーを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - StickyLogic.createが呼ばれないことを検証
	 */
	it("should not create sticky when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(100_000);

		return (async () => {
			// テスト用のチャンネルID
			const channelClientId = "2";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者ユーザーを追加
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			await createTestChannel(testCommunityId, channelClientId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								// TextChannelではないオブジェクトを返す
								return {}; // instanceof TextChannel は false を返す
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ（タイムアウトを延長）
			await waitUntilReply(commandMock, 10_000);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルにはスティッキーを登録できないよ！っ");

			// Stickyにデータが作られていないことを確認
			await expectNoStickies();
		})();
	});
	/**
	 * [モーダル表示] スティッキー作成時にモーダルが表示される
	 * - モーダルが表示されることを検証
	 * - モーダルに適切なタイトルとフィールドが設定されていることを検証
	 */
	it("should display modal with appropriate title and fields when creating sticky", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者ユーザーを追加
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			await createTestChannel(testCommunityId, channelClientId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelClientId }, TEST_USER_ID);

			// showModalメソッドをモック
			let capturedModal: any = null;
			when(commandMock.showModal(anything())).thenCall((modal: any) => {
				capturedModal = modal;
				return Promise.resolve();
			});

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								// TextChannelのインスタンスとして認識されるようにする
								// Object.createを使用してTextChannelのプロトタイプを継承したオブジェクトを作成
								const textChannel = Object.create(TextChannel.prototype);
								// 必要なメソッドをモック
								textChannel.send = () => Promise.resolve({ id: messageId, content: "test message" } as any);
								// 必要なプロパティを追加
								textChannel.id = channelClientId;
								textChannel.type = 0; // TextChannelのtype
								return textChannel;
							}
							return null;
						},
					},
				},
			} as any);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダルが表示されるまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// モーダルが表示されたことを検証
			verify(commandMock.showModal(anything())).once();

			// モーダルが正しく設定されていることを検証
			expect(capturedModal).to.not.be.null;

			// ModalBuilderのインスタンスであることを確認
			expect(capturedModal instanceof ModalBuilder).to.be.true;

			// モーダルのタイトルとカスタムIDを検証
			const modalData = capturedModal.toJSON();
			expect(modalData).to.have.property("custom_id", "stickyModal");
			expect(modalData).to.have.property("title", "スティッキーの登録");

			// モーダルのコンポーネント（テキスト入力フィールド）を検証
			expect(capturedModal.components.length).to.eq(1);

			// ActionRowBuilderのインスタンスであることを確認
			const actionRow = capturedModal.components[0];
			expect(actionRow.components.length).to.eq(1);

			// TextInputBuilderのインスタンスであることを確認
			const textInput = actionRow.components[0];
			expect(textInput instanceof TextInputBuilder).to.be.true;

			// テキスト入力フィールドの設定を検証
			const textInputData = textInput.toJSON();
			expect(textInputData).to.have.property("custom_id", "stickyInput");
			expect(textInputData).to.have.property("label", "スティッキーの文章");
			expect(textInputData).to.have.property("style", TextInputStyle.Paragraph);
		})();
	});

	/**
	 * [モーダル送信] 空のメッセージでモーダルを送信するとエラーになる
	 * - 空のメッセージでモーダル送信時にエラーメッセージが返されることを検証
	 * - StickyLogic.createが呼ばれないことを検証
	 */
	it("should return error when modal is submitted with empty message", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者ユーザーを追加
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			await createTestChannel(testCommunityId, channelClientId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelClientId }, TEST_USER_ID);

			// モーダル送信のモック - 直接オブジェクトを作成
			const modalSubmitInteraction = {
				fields: {
					getTextInputValue: (customId: string) => {
						if (customId === "stickyInput") {
							return ""; // 空のメッセージを返す
						}
						return null;
					},
				},
				guildId: TEST_GUILD_ID,
				reply: async (message: string) => {
					modalSubmitInteraction.replyMessage = message;
					return {} as any;
				},
				replyMessage: "", // 返信メッセージを保存するためのプロパティ
			};

			// awaitModalSubmitメソッドをモック
			when(commandMock.awaitModalSubmit(anything())).thenResolve(modalSubmitInteraction as any);

			// showModalメソッドをモック
			when(commandMock.showModal(anything())).thenResolve();

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								// TextChannelのインスタンスとして認識されるようにする
								const textChannel = Object.create(TextChannel.prototype);
								// 必要なメソッドをモック
								textChannel.send = () => Promise.resolve({ id: messageId, content: "test message" } as any);
								// 必要なプロパティを追加
								textChannel.id = channelClientId;
								textChannel.type = 0; // TextChannelのtype
								return textChannel;
							}
							return null;
						},
					},
				},
			} as any);

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダル送信の処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// エラーメッセージが返されたことを検証
			expect(modalSubmitInteraction.replyMessage).to.eq("スティッキーに登録するメッセージがないよ！っ");

			// Stickyにデータが作られていないことを確認
			await expectNoStickies();
		})();
	});
	/**
	 * [メッセージ送信] スティッキーメッセージがチャンネルに送信される
	 * - チャンネルのsendメソッドが呼ばれることを検証
	 * - 送信されるメッセージの内容が正しいことを検証
	 */
	it("should send sticky message to channel when modal is submitted with valid message", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const stickyMessageText = "これはスティッキーメッセージです";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者ユーザーを追加
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelClientId }, TEST_USER_ID);

			// sendメソッドをモックするためのオブジェクト
			let sentMessage = "";
			const textChannel = {
				id: channelClientId,
				type: 0, // TextChannelのtype
				send: (message: string) => {
					sentMessage = message;
					return Promise.resolve({ id: messageId, content: message } as any);
				},
			};

			// モーダル送信のモック
			const modalSubmitInteraction = {
				fields: {
					getTextInputValue: (customId: string) => {
						if (customId === "stickyInput") {
							return stickyMessageText; // 有効なメッセージを返す
						}
						return null;
					},
				},
				guildId: TEST_GUILD_ID,
				reply: async (message: string) => {
					modalSubmitInteraction.replyMessage = message;
					return {} as any;
				},
				replyMessage: "", // 返信メッセージを保存するためのプロパティ
			};

			// awaitModalSubmitメソッドをモック
			when(commandMock.awaitModalSubmit(anything())).thenResolve(modalSubmitInteraction as any);

			// showModalメソッドをモック
			when(commandMock.showModal(anything())).thenResolve();

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								// TextChannelのインスタンスとして認識されるようにする
								const mockTextChannel = Object.create(TextChannel.prototype);
								// 必要なプロパティとメソッドを追加
								mockTextChannel.id = channelClientId;
								mockTextChannel.type = 0; // TextChannelのtype
								mockTextChannel.send = textChannel.send;
								return mockTextChannel;
							}
							return null;
						},
					},
				},
			} as any);

			// データベースにスティッキーが存在しないことを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダル送信の処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 送信されたメッセージの内容が正しいことを検証
			expect(sentMessage).to.eq(stickyMessageText);

			// スティッキーが正常に作成されたことを確認
			expect(modalSubmitInteraction.replyMessage).to.eq("スティッキーを登録したよ！っ");

			// データベースにスティッキーが保存されていることを確認
			const afterStickies = await StickyRepositoryImpl.findAll();
			expect(afterStickies.length).to.eq(1);
			expect(String(afterStickies[0].communityId)).to.eq(String(testCommunityId));
			expect(String(afterStickies[0].channelId)).to.eq(String(dbChannelId));
			expect(String(afterStickies[0].userId)).to.eq(String(testUserId));
			expect(String(afterStickies[0].messageId)).to.eq(String(messageId));
			expect(afterStickies[0].message).to.eq(stickyMessageText);
		})();
	});
	/**
	 * StickyDeleteCommandHandlerテスト仕様
	 */

	/**
	- [権限チェック] 管理者権限がない場合はスティッキーを削除できない
	- - コマンド実行時に権限チェックが行われることを検証
	- - 権限がない場合にエラーメッセージが返されることを検証
	- - StickyLogic.deleteメソッドが呼ばれないことを検証
	 */
	it("should not delete sticky when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 非管理者ユーザーIDを設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// RoleConfigのモック - 明示的に非管理者として設定
			setupRoleConfig(userId, "user");

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			setupCommandBasics(commandMock, guildId);

			// replyメソッドをモック
			const replyCapture = setupReplyCapture(commandMock);

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyCapture.getValue()).to.eq("スティッキーを登録する権限を持っていないよ！っ");

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();
		})();
	});

	/**
	 * [存在チェック] 登録されていないスティッキーは削除できない
	 * - StickyLogic.findが呼ばれることを検証
	 * - スティッキーが存在しない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 */
	it("should not delete sticky when sticky does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelId = "2";

			// RoleConfigのモック - 管理者として設定
			setupRoleConfig(TEST_USER_ID, "admin");

			// テスト用Channelを作成
			await createTestChannel(testCommunityId, channelId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, TEST_USER_ID);

			// guildIdとchannelを設定
			setupCommandBasics(commandMock, TEST_GUILD_ID);

			// replyメソッドをモック
			const replyCapture = setupReplyCapture(commandMock);

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyCapture.getValue()).to.eq("スティッキーが登録されていなかったよ！っ");

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();
		})();
	});
	/**
	 * [チャンネル検証] チャンネルが存在しない場合はエラーになる
	 * - チャンネルの存在チェックが行われることを検証
	 * - チャンネルが存在しない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 */
	it("should not delete sticky when channel does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// チャンネルが存在しないようにguildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							// チャンネルが存在しないのでundefinedを返す
							return undefined;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 2000);

			// 応答の検証 - チャンネルが存在しない場合のエラーメッセージ
			expect(replyValue).to.eq("スティッキーの投稿がなかったよ！っ");

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);
		})();
	});

	/**
	 * [チャンネル型検証] TextChannel以外のスティッキーは削除できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 * */
	it("should not delete sticky when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにguildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								// TextChannelではないオブジェクトを返す
								return {}; // instanceof TextChannel は false を返す
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルのスティッキーを削除できないよ！っ");

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);
		})();
	});

	/**
	 * [メッセージ削除] スティッキーメッセージが削除される
	 * - メッセージのdeleteメソッドが呼ばれることを検証
	 * - 削除に成功した場合にStickyLogic.deleteが呼ばれることを検証
	 */
	it("should delete sticky message when command is executed successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			const messageMock = {
				id: messageId,
				content: message,
				delete: () => {
					return Promise.resolve(true);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// deferReplyとeditReplyメソッドをモック
			when(commandMock.deferReply()).thenResolve({} as any);
			let editReplyValue = "";
			when(commandMock.editReply(anything())).thenCall((message: string) => {
				editReplyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除成功メッセージ
			expect(editReplyValue).to.eq("スティッキーを削除したよ！っ");

			// データベースからスティッキーが削除されていることを確認
			await expectNoStickies();
		})();
	});

	/**
	 * [削除失敗] メッセージの削除に失敗した場合はエラーメッセージが返される
	 * - メッセージの削除に失敗した場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 */
	it("should return error message when message deletion fails", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック - 削除に失敗するように設定
			const messageMock = {
				id: messageId,
				content: message,
				delete: () => {
					return Promise.resolve(false); // 削除に失敗
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 応答の検証 - 削除失敗メッセージ
			expect(replyValue).to.eq("スティッキーの削除に失敗したよ！っ");

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);
		})();
	});

	/**
	 * [スティッキー削除] 正常にスティッキーが削除される
	 * - StickyLogic.deleteが正しいパラメータで呼ばれることを検証
	 * - 削除成功時に成功メッセージが返されることを検証
	 */
	it("should call StickyLogic.delete with correct parameters and return success message", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			const messageMock = {
				id: messageId,
				content: message,
				delete: () => {
					return Promise.resolve(true);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// deferReplyとeditReplyメソッドをモック
			when(commandMock.deferReply()).thenResolve({} as any);
			let editReplyValue = "";
			when(commandMock.editReply(anything())).thenCall((message: string) => {
				editReplyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除成功メッセージ
			expect(editReplyValue).to.eq("スティッキーを削除したよ！っ");

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();
		})();
	});

	/**
	 * StickyListCommandHandlerテスト仕様
	 */

	/**
	- [権限チェック] 管理者権限がない場合はスティッキーリストを表示できない
	* -	- コマンド実行時に権限チェックが行われることを検証
	* - 権限がない場合にエラーメッセージが返されることを検証
	* - StickyLogic.findByCommunityIdメソッドが呼ばれないことを検証
	*/
	it("should not display sticky list when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 非管理者ユーザーIDを設定
			const guildId = "1";
			const userId = "2";

			// RoleConfigのモック - 明示的に非管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "user" }, // 非管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickylist", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーを表示する権限を持っていないよ！っ");

			// データベースにスティッキーが存在しないことを確認
			const afterStickies = await StickyRepositoryImpl.findAll();
			expect(afterStickies.length).to.eq(0);
		})();
	});

	/**
	 * [スティッキーリスト表示] スティッキーが登録されていない場合はその旨を表示する
	 * - StickyLogic.findByCommunityIdメソッドが呼ばれることを検証
	 * - スティッキーが登録されていない場合にその旨のメッセージが表示されることを検証
	 */
	it("should display message when no stickies are registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickylist", {}, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在しないことを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");

			// データベースにスティッキーが存在しないことを確認
			const afterStickies = await StickyRepositoryImpl.findAll();
			expect(afterStickies.length).to.eq(0);
		})();
	});

	/**
	 * [リスト表示] 登録されているスティッキーの一覧が表示される
	 * - StickyLogic.findByCommunityIdが正しいパラメータで呼ばれることを検証
	 * - 返されたスティッキーリストが適切にフォーマットされて表示されることを検証
	 * - チャンネルIDが正しくDiscordのメンション形式（<#ID>）で表示されることを検証
	 * */
	it("should display formatted sticky list with correct channel mentions", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelId1 = "2";
			const channelId2 = "3";
			const messageId = "5";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channelId1,
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channelId2,
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickylist", {}, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(2);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			// 1. 適切なフォーマットで表示されていることを検証
			expect(replyValue).to.include("以下のチャンネルにスティッキーが登録されているよ！");

			// 2. チャンネルIDが正しくDiscordのメンション形式（<#ID>）で表示されていることを検証
			expect(replyValue).to.include(`<#${channelId1}>`);
			expect(replyValue).to.include(`<#${channelId2}>`);

			// 3. 返されたスティッキーリストが適切にフォーマットされていることを検証
			// 各チャンネルが箇条書き（- で始まる行）で表示されていることを確認
			const lines = replyValue.split("\n");
			expect(lines.length).to.be.at.least(3); // ヘッダー + 2つのチャンネル
			expect(lines[0]).to.eq("以下のチャンネルにスティッキーが登録されているよ！");
			expect(lines[1]).to.match(/^- <#\d+>$/);
			expect(lines[2]).to.match(/^- <#\d+>$/);
		})();
	});

	/**
	 * StickyUpdateCommandHandler テスト仕様
	 */

	/**
	 * [権限チェック] 管理者権限がない場合はスティッキーを更新できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.updateMessageメソッドが呼ばれないことを検証
	 */
	it("should not update sticky when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 非管理者ユーザーIDを設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// RoleConfigのモック - 明示的に非管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "user" }, // 非管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーを更新する権限を持っていないよ！っ");
		})();
	});

	/**
	 * [存在チェック] 登録されていないスティッキーは更新できない
	 * - StickyLogic.findが呼ばれることを検証
	 * - スティッキーが存在しない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.updateMessageが呼ばれないことを検証
	 */
	it("should not update sticky when sticky does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelId = "2";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成
			await createTestChannel(testCommunityId, channelId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelのモック - スティッキーが存在しないことをテストするために必要
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelId;
			textChannelMock.type = 0; // TextChannelのtype

			// guildのモックを設定 - TextChannelを返すように設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在しないことを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証 - スティッキーが存在しない場合のエラーメッセージ
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");

			// データベースからスティッキーが削除されていないことを確認
			const afterStickies = await StickyRepositoryImpl.findAll();
			expect(afterStickies.length).to.eq(0);
		})();
	});

	/**
	 * [チャンネル検証] TextChannel以外のスティッキーは更新できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - StickyLogic.updateMessageが呼ばれないことを検証
	 */
	it("should not update sticky when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成
			await createTestChannel(testCommunityId, channelId);

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channelId,
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにguildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelではないオブジェクトを返す
								return {}; // instanceof TextChannel は false を返す
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 2000);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルにはスティッキーを登録できないよ！っ");

			// データベースのスティッキーが更新されていないことを確認
			const afterStickiy = await StickyRepositoryImpl.findOne({
				where: {
					communityId: testCommunityId,
					channelId: channelId,
				},
			});
			expect(afterStickiy).to.not.be.null;
			expect(afterStickiy?.message).to.eq(message);
		})();
	});

	/**
	 * [モーダル表示] スティッキー更新時にモーダルが表示される
	 * - モーダルが表示されることを検証
	 * - モーダルに現在のスティッキーメッセージが初期値として設定されていることを検証
	 */
	it("should display modal with current sticky message as initial value when updating sticky", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者ユーザーを追加
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelClientId }, TEST_USER_ID);

			// showModalメソッドをモック
			let capturedModal: any = null;
			when(commandMock.showModal(anything())).thenCall((modal: any) => {
				capturedModal = modal;
				return Promise.resolve();
			});

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			const messageMock = {
				id: messageId,
				content: message,
				delete: () => {
					return Promise.resolve(true);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダルが表示されるまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// モーダルが表示されたことを検証
			verify(commandMock.showModal(anything())).once();

			// モーダルが正しく設定されていることを検証
			expect(capturedModal).to.not.be.null;

			// ModalBuilderのインスタンスであることを確認
			expect(capturedModal instanceof ModalBuilder).to.be.true;

			// モーダルのタイトルとカスタムIDを検証
			const modalData = capturedModal.toJSON();
			expect(modalData).to.have.property("custom_id", "stickyModal");
			expect(modalData).to.have.property("title", "スティッキーの更新");

			// モーダルのコンポーネント（テキスト入力フィールド）を検証
			expect(capturedModal.components.length).to.eq(1);

			// ActionRowBuilderのインスタンスであることを確認
			const actionRow = capturedModal.components[0];
			expect(actionRow.components.length).to.eq(1);

			// TextInputBuilderのインスタンスであることを確認
			const textInput = actionRow.components[0];
			expect(textInput instanceof TextInputBuilder).to.be.true;

			// テキスト入力フィールドの設定を検証
			const textInputData = textInput.toJSON();
			expect(textInputData).to.have.property("custom_id", "stickyInput");
			expect(textInputData).to.have.property("label", "スティッキーの文章");
			expect(textInputData).to.have.property("style", TextInputStyle.Paragraph);
		})();
	});

	/**
	 * [モーダル送信] 空のメッセージでモーダルを送信するとエラーになる
	 * - 空のメッセージでモーダル送信時にエラーメッセージが返されることを検証
	 * - StickyLogic.updateMessageが呼ばれないことを検証
	 */
	it("should return error when modal is submitted with empty message for update", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelClientId }, TEST_USER_ID);

			// モーダル送信のモック - 直接オブジェクトを作成
			const modalSubmitInteraction = {
				fields: {
					getTextInputValue: (customId: string) => {
						if (customId === "stickyInput") {
							return ""; // 空のメッセージを返す
						}
						return null;
					},
				},
				guildId: TEST_GUILD_ID,
				reply: async (message: string) => {
					modalSubmitInteraction.replyMessage = message;
					return {} as any;
				},
				replyMessage: "", // 返信メッセージを保存するためのプロパティ
			};

			// awaitModalSubmitメソッドをモック
			when(commandMock.awaitModalSubmit(anything())).thenResolve(modalSubmitInteraction as any);

			// showModalメソッドをモック
			when(commandMock.showModal(anything())).thenResolve();

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			const messageMock = {
				id: messageId,
				content: message,
				edit: (newContent: string) => {
					return Promise.resolve({ id: messageId, content: newContent } as any);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダル送信の処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// エラーメッセージが返されたことを検証
			expect(modalSubmitInteraction.replyMessage).to.eq("スティッキーに登録するメッセージがないよ！っ");

			// データベースのスティッキーが更新されていないことを確認
			const afterStickiy = await StickyRepositoryImpl.findOne({
				where: {
					communityId: testCommunityId,
					channelId: String(dbChannelId),
				},
			});
			expect(afterStickiy).to.not.be.null;
			expect(afterStickiy?.message).to.eq(message); // メッセージが更新されていないことを確認
		})();
	});

	/**
	 * [スティッキー更新] 正常にスティッキーが更新される
	 * - StickyLogic.updateMessageが正しいパラメータで呼ばれることを検証
	 * - 更新成功時に成功メッセージが返されることを検証
	 */
	it("should update sticky message successfully and return success message", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const originalMessage = "元のスティッキーメッセージ";
			const updatedMessage = "更新されたスティッキーメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: originalMessage,
			});

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelClientId }, TEST_USER_ID);

			// モーダル送信のモック
			const modalSubmitInteraction = {
				fields: {
					getTextInputValue: (customId: string) => {
						if (customId === "stickyInput") {
							return updatedMessage; // 更新されたメッセージを返す
						}
						return null;
					},
				},
				guildId: TEST_GUILD_ID,
				reply: async (message: string) => {
					modalSubmitInteraction.replyMessage = message;
					return {} as any;
				},
				replyMessage: "", // 返信メッセージを保存するためのプロパティ
			};

			// awaitModalSubmitメソッドをモック
			when(commandMock.awaitModalSubmit(anything())).thenResolve(modalSubmitInteraction as any);

			// showModalメソッドをモック
			when(commandMock.showModal(anything())).thenResolve();

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			let editedContent = "";
			const messageMock = {
				id: messageId,
				content: originalMessage,
				edit: (newContent: string) => {
					editedContent = newContent;
					messageMock.content = newContent; // Update the content property
					return Promise.resolve({ id: messageId, content: newContent } as any);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);
			expect(beforeStickies[0].message).to.eq(originalMessage);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダル送信の処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// メッセージが編集されたことを検証
			expect(editedContent).to.eq(updatedMessage);

			// 成功メッセージが返されたことを検証
			expect(modalSubmitInteraction.replyMessage).to.eq("スティッキーを更新したよ！っ");

			// データベースのスティッキーが更新されていることを確認
			const afterStickiy = await StickyRepositoryImpl.findOne({
				where: {
					communityId: testCommunityId,
					channelId: String(dbChannelId),
				},
			});
			expect(afterStickiy).to.not.be.null;
			expect(afterStickiy?.message).to.eq(updatedMessage);
		})();
	});

	/**
	 * StickyEventHandler テスト仕様
	 */

	/**
	 * [ボットメッセージ] ボットのメッセージではスティッキーが再投稿されない
	 * - ボットからのメッセージの場合、処理が中断されることを検証
	 * - StickyLogic.findが呼ばれないことを検証
	 */
	it("should not repost sticky when message is from a bot", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// ボットからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(userId, guildId, channelId, { isBot: true });

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [スレッドメッセージ] スレッド内のメッセージではスティッキーが再投稿されない
	 * - スレッド内のメッセージの場合、処理が中断されることを検証
	 */
	it("should not repost sticky when message is in a thread", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// スレッド内のメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelId, { isThread: true });

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [チャンネル検証] チャンネルが存在しない場合は処理が中断される
	 * - チャンネルの存在チェックが行われることを検証
	 * - チャンネルが存在しない場合、処理が中断されることを検証
	 */
	it("should interrupt process when channel does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// 通常のユーザーからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelId);

			// guildをモック - チャンネルが存在しないように設定（ヘルパー関数使用）
			setupEventGuildMock(messageMock, channelId, undefined);

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [チャンネル型検証] TextChannel以外では処理が中断される
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合、処理が中断されることを検証
	 */
	it("should interrupt process when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// 通常のユーザーからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelId);

			// guildをモック - TextChannel以外のチャンネルを返すように設定（ヘルパー関数使用）
			setupEventGuildMock(messageMock, channelId, {}); // 空オブジェクト = 非TextChannel

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [古いメッセージ削除] 古いスティッキーメッセージが削除される
	 * - 古いメッセージのdeleteメソッドが呼ばれることを検証
	 * - 新しいメッセージIDが正しく設定されることを検証
	 */
	it("should delete old sticky message when new message is posted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelClientId = "2";
			const oldMessageId = "4";
			const newMessageId = "5";
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await createTestSticky(testCommunityId, testUserId, String(dbChannelId), oldMessageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// 通常のユーザーからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelClientId);

			// 古いメッセージのモック - 削除が成功するケース
			let deleteWasCalled = false;
			const oldMessageMock = createMessageMock(oldMessageId, message, {
				onDelete: () => {
					deleteWasCalled = true;
				},
			});

			// 新しいメッセージのモック - guildIdとchannelIdが必要（StickyEventHandlerでチェックされる）
			const newMessageMock = {
				id: newMessageId,
				content: message,
				guildId: TEST_GUILD_ID,
				channelId: channelClientId,
			};

			// TextChannelのモック（ヘルパー関数使用）
			const textChannelMock = createEventTextChannelMock(channelClientId, oldMessageMock, newMessageMock);

			// guildをモック - TextChannelを返すように設定（ヘルパー関数使用）
			setupEventGuildMock(messageMock, channelClientId, textChannelMock);

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// message.delete()が呼ばれることを検証
			expect(deleteWasCalled).to.eq(true);

			// StickyのmessageIdが更新されたことを検証
			await expectStickyMessageIdUpdated(testCommunityId, String(dbChannelId), newMessageId);
		})();
	});
});
