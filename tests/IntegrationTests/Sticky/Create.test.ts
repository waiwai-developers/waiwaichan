import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	MessageRepositoryImpl,
	StickyRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import type { InteractionResponse } from "discord.js";
import { ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, verify, when } from "ts-mockito";
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

// ============================================
// モックファクトリ関数
// ============================================

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
async function createTestChannel(communityId: number, channelClientId: string): Promise<number> {
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
async function createTestSticky(communityId: number, userId: number, channelId: string, messageId: string, message: string): Promise<void> {
	await StickyRepositoryImpl.create({
		communityId,
		channelId,
		userId,
		messageId,
		message,
	});
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
async function expectStickyExists(communityId: number, channelId: string, expectedData?: ExpectedStickyData): Promise<void> {
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

describe("Test StickyCreateCommandHandler", () => {
	// テスト用のコミュニティとユーザーのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;

	beforeEach(async () => {
		new MysqlConnector();
		// Clean up existing records
		await StickyRepositoryImpl.destroy({ truncate: true, force: true });
		await MessageRepositoryImpl.destroy({ truncate: true, force: true });
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
		await MessageRepositoryImpl.destroy({
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID, // ユーザーをオーナーに設定
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

			// テスト用Channelを作成（DBのchannel.idを取得）
			await createTestChannel(testCommunityId, channelClientId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにモック
			when(commandMock.guild).thenReturn({
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID, // ユーザーをオーナーに設定
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID, // ユーザーをオーナーに設定
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID, // ユーザーをオーナーに設定
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID, // ユーザーをオーナーに設定
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
			// messageIdはMessageテーブルの内部ID（autoincrement）なのでMessage作成を確認
			const afterMessages = await MessageRepositoryImpl.findAll();
			expect(afterMessages.length).to.eq(1);
			expect(String(afterStickies[0].messageId)).to.eq(String(afterMessages[0].id));
			expect(String(afterMessages[0].clientId)).to.eq(String(messageId));
			expect(afterStickies[0].message).to.eq(stickyMessageText);
		})();
	});
});
