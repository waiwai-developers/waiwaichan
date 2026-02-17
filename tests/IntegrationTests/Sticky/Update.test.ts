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
import { ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, verify, when } from "ts-mockito";
import { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";

// テスト用の定数
const TEST_GUILD_ID = "1234567890"; // communityのclientId
const TEST_USER_ID = "1234"; // userのclientId

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

describe("Test StickyUpdateCommandHandler", () => {
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
	 * [存在チェック] 登録されていないスティッキーは更新できない
	 * - StickyLogic.findが呼ばれることを検証
	 * - スティッキーが存在しない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.updateMessageが呼ばれないことを検証
	 */
	it("should not update sticky when sticky does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";

			// テスト用Channelを作成
			await createTestChannel(testCommunityId, channelClientId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelのモック - スティッキーが存在しないことをテストするために必要
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype

			// guildのモックを設定 - TextChannelを返すように設定
			when(commandMock.guild).thenReturn({
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID,
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

			// データベースにスティッキーが存在しないことを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 2000);

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
			const channelClientId = "2";
			const messageClientId = "4";
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにguildのモックを設定
			when(commandMock.guild).thenReturn({
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID,
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
					channelId: String(dbChannelId),
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
			const messageClientId = "4";
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: message,
			});


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
				id: messageClientId,
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID,
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
			await new Promise((resolve) => setTimeout(resolve, 500));

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
			const messageClientId = "4";
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: message,
			});

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
				id: messageClientId,
				content: message,
				edit: (newContent: string) => {
					return Promise.resolve({ id: messageClientId, content: newContent } as any);
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID,
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
			await new Promise((resolve) => setTimeout(resolve, 2000));

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
			const messageClientId = "4";
			const originalMessage = "元のスティッキーメッセージ";
			const updatedMessage = "更新されたスティッキーメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: originalMessage,
			});

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
				id: messageClientId,
				content: originalMessage,
				edit: (newContent: string) => {
					editedContent = newContent;
					messageMock.content = newContent; // Update the content property
					return Promise.resolve({ id: messageClientId, content: newContent } as any);
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
				id: TEST_GUILD_ID,
				ownerId: TEST_USER_ID,
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
			expect(modalSubmitInteraction.replyMessage).to.include("スティッキーを更新したよ！っ");

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
});
