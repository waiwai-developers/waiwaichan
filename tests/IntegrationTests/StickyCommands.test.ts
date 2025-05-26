import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { StickyRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import { ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { TestDiscordServer } from "../fixtures/discord.js/TestDiscordServer";

describe("Test Sticky Commands", () => {
	beforeEach(() => {
		new MysqlConnector();
	});

	afterEach(async () => {
		await StickyRepositoryImpl.destroy({
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
			const channelid = "2";
			const userId = "3";

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelid }, userId);

			// RoleConfigのモック
			RoleConfig.users = [{ discordId: userId, role: "user" }];

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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーを登録する権限を持っていないよ！っ");

			// Stickyにデータが作られていないことを確認
			const res = await StickyRepositoryImpl.findAll();
			expect(res.length).to.eq(0);
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のスティッキーを返すようにfindメソッドをモック

			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーが既にチャンネルに登録されているよ！っ");

			// Stickyにデータが作られていないことを確認
			const res = await StickyRepositoryImpl.findAll();
			expect(res.length).to.eq(1);
			expect(String(res[0].guildId)).to.eq(String(guildId));
			expect(String(res[0].channelId)).to.eq(String(channelId));
			expect(String(res[0].userId)).to.eq(String(userId));
			expect(String(res[0].messageId)).to.eq(String(messageId));
			expect(res[0].message).to.eq(message);
		})();
	});
	/**
	 * [チャンネル検証] TextChannel以外にはスティッキーを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - StickyLogic.createが呼ばれないことを検証
	 */
	it("should not create sticky when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のチャンネルID
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: userId, role: "admin" }, // 管理者ユーザーを追加
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにモック
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルにはスティッキーを登録できないよ！っ");

			// Stickyにデータが作られていないことを確認
			const res = await StickyRepositoryImpl.findAll();
			expect(res.length).to.eq(0);
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: userId, role: "admin" }, // 管理者ユーザーを追加
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

			// showModalメソッドをモック
			let capturedModal: any = null;
			when(commandMock.showModal(anything())).thenCall((modal: any) => {
				capturedModal = modal;
				return Promise.resolve();
			});

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelのインスタンスとして認識されるようにする
								// Object.createを使用してTextChannelのプロトタイプを継承したオブジェクトを作成
								const textChannel = Object.create(TextChannel.prototype);
								// 必要なメソッドをモック
								textChannel.send = () => Promise.resolve({ id: messageId, content: "test message" } as any);
								// 必要なプロパティを追加
								textChannel.id = channelId;
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: userId, role: "admin" }, // 管理者ユーザーを追加
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

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
				guildId: guildId,
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
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelのインスタンスとして認識されるようにする
								const textChannel = Object.create(TextChannel.prototype);
								// 必要なメソッドをモック
								textChannel.send = () => Promise.resolve({ id: messageId, content: "test message" } as any);
								// 必要なプロパティを追加
								textChannel.id = channelId;
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

			// モーダル送信の処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// エラーメッセージが返されたことを検証
			expect(modalSubmitInteraction.replyMessage).to.eq("スティッキーに登録するメッセージがないよ！っ");

			// Stickyにデータが作られていないことを確認
			const res = await StickyRepositoryImpl.findAll();
			expect(res.length).to.eq(0);
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const stickyMessageText = "これはスティッキーメッセージです";

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: userId, role: "admin" }, // 管理者ユーザーを追加
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

			// sendメソッドをモックするためのオブジェクト
			let sentMessage = "";
			const textChannel = {
				id: channelId,
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
				guildId: guildId,
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
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelのインスタンスとして認識されるようにする
								const mockTextChannel = Object.create(TextChannel.prototype);
								// 必要なプロパティとメソッドを追加
								mockTextChannel.id = channelId;
								mockTextChannel.type = 0; // TextChannelのtype
								mockTextChannel.send = textChannel.send;
								return mockTextChannel;
							}
							return null;
						},
					},
				},
			} as any);

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
			const stickies = await StickyRepositoryImpl.findAll();
			expect(stickies.length).to.eq(1);
			expect(String(stickies[0].guildId)).to.eq(String(guildId));
			expect(String(stickies[0].channelId)).to.eq(String(channelId));
			expect(String(stickies[0].userId)).to.eq(String(userId));
			expect(String(stickies[0].messageId)).to.eq(String(messageId));
			expect(stickies[0].message).to.eq(stickyMessageText);
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
			RoleConfig.users = [
				{ discordId: userId, role: "user" }, // 非管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーを登録する権限を持っていないよ！っ");
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");
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
			const adminUserId = "1";
			const guildId = "2";
			const channelId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: adminUserId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: adminUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, adminUserId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証 - チャンネルが存在しない場合のエラーメッセージ
			expect(replyValue).to.eq("スティッキーの投稿がなかったよ！っ");
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
			const guildId = "1";
			const channelId = "2";
			const adminUserId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: adminUserId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: adminUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, adminUserId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルのスティッキーを削除できないよ！っ");
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
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
			textChannelMock.id = channelId;
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
							if (id === channelId) {
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除成功メッセージ
			expect(editReplyValue).to.eq("スティッキーを削除したよ！っ");

			// データベースからスティッキーが削除されていることを確認
			const stickies = await StickyRepositoryImpl.findAll();
			expect(stickies.length).to.eq(0);
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
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
			textChannelMock.id = channelId;
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除失敗メッセージ
			expect(replyValue).to.eq("スティッキーの削除に失敗したよ！っ");

			// データベースからスティッキーが削除されていないことを確認
			const stickies = await StickyRepositoryImpl.findAll();
			expect(stickies.length).to.eq(1);
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
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
			textChannelMock.id = channelId;
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
							if (id === channelId) {
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除成功メッセージ
			expect(editReplyValue).to.eq("スティッキーを削除したよ！っ");
			const stickies = await StickyRepositoryImpl.findAll();
			expect(stickies.length).to.eq(0);
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーを表示する権限を持っていないよ！っ");
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
			const guildId = "1";
			const userId = "2";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");
		})();
	});
	/**
	 * [空リスト] スティッキーが登録されていない場合は適切なメッセージを表示
	 * - StickyLogic.findByCommunityIdが呼ばれることを検証
	 * - 空の配列が返された場合に適切なメッセージが表示されることを検証
	 */
	it("should verify findByCommunityId is called and display appropriate message when no stickies are registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定

			const guildId = "1";
			const userId = "2";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証 - スティッキーが登録されていない場合のメッセージ
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");
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
			const guildId = "1";
			const channelId1 = "2";
			const channelId2 = "3";
			const userId = "4";
			const messageId = "5";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId1,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId2,
				userId: userId,
				messageId: messageId,
				message: message,
			});

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
			await waitUntilReply(commandMock, 100);

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
			await waitUntilReply(commandMock, 100);

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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証 - スティッキーが存在しない場合のエラーメッセージ
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルにはスティッキーを登録できないよ！っ");

			// データベースのスティッキーが更新されていないことを確認
			const sticky = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});
			expect(sticky).to.not.be.null;
			expect(sticky?.message).to.eq(message); // メッセージが更新されていないことを確認
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// RoleConfigのモック
			(RoleConfig as any).users = [
				{ discordId: userId, role: "admin" }, // 管理者ユーザーを追加
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, userId);

			// showModalメソッドをモック
			let capturedModal: any = null;
			when(commandMock.showModal(anything())).thenCall((modal: any) => {
				capturedModal = modal;
				return Promise.resolve();
			});

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelのインスタンスとして認識されるようにする
								// Object.createを使用してTextChannelのプロトタイプを継承したオブジェクトを作成
								const textChannel = Object.create(TextChannel.prototype);
								// 必要なメソッドをモック
								textChannel.send = () => Promise.resolve({ id: messageId, content: "test message" } as any);
								// 必要なプロパティを追加
								textChannel.id = channelId;
								textChannel.type = 0; // TextChannelのtype
								return textChannel;
							}
							return null;
						},
					},
				},
			} as any);

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
			textChannelMock.id = channelId;
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
							if (id === channelId) {
								return textChannelMock;
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, userId);

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
				guildId: guildId,
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
			when(commandMock.guildId).thenReturn(guildId);
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
			textChannelMock.id = channelId;
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
							if (id === channelId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// モーダル送信の処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// エラーメッセージが返されたことを検証
			expect(modalSubmitInteraction.replyMessage).to.eq("スティッキーに登録するメッセージがないよ！っ");

			// データベースのスティッキーが更新されていないことを確認
			const sticky = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});
			expect(sticky).to.not.be.null;
			expect(sticky?.message).to.eq(message); // メッセージが更新されていないことを確認
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const originalMessage = "元のスティッキーメッセージ";
			const updatedMessage = "更新されたスティッキーメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: originalMessage,
			});

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: userId, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickyupdate", { channelid: channelId }, userId);

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
				guildId: guildId,
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
			when(commandMock.guildId).thenReturn(guildId);
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
			textChannelMock.id = channelId;
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
							if (id === channelId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

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
			const sticky = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});
			expect(sticky).to.not.be.null;
			expect(sticky?.message).to.eq(updatedMessage); // メッセージが更新されていることを確認
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
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// テスト前のスティッキー情報を取得
			const stickyBefore = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// ボットからのメッセージをモック作成
			const messageMock = mockMessage(userId, false, true); // isBotMessage = true

			// guildIdとchannelIdを設定
			when(messageMock.guildId).thenReturn(guildId);
			when(messageMock.channelId).thenReturn(channelId);

			// チャンネルをモック
			const channelMock = mock<TextChannel>();
			when(channelMock.isThread()).thenReturn(false);
			when(messageMock.channel).thenReturn(instance(channelMock));

			// TestDiscordServerを使用してmessageCreateイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageCreate", instance(messageMock));

			// 処理が完了するまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// テスト後のスティッキー情報を取得
			const stickyAfter = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// StickyのmessageIdが更新されないことを検証
			expect(stickyAfter).to.not.be.null;
			expect(String(stickyAfter?.messageId)).to.eq(String(messageId));
			expect(String(stickyAfter?.messageId)).to.eq(String(stickyBefore?.messageId));
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// テスト前のスティッキー情報を取得
			const stickyBefore = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// 通常のユーザーからのメッセージをモック作成
			const messageMock = mockMessage(userId, false, false); // isBotMessage = false

			// guildIdとchannelIdを設定
			when(messageMock.guildId).thenReturn(guildId);
			when(messageMock.channelId).thenReturn(channelId);

			// チャンネルをモック - スレッドとして設定
			const channelMock = mock<TextChannel>();
			when(channelMock.isThread()).thenReturn(true); // スレッドとして設定
			when(messageMock.channel).thenReturn(instance(channelMock));

			// TestDiscordServerを使用してmessageCreateイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageCreate", instance(messageMock));

			// 処理が完了するまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// テスト後のスティッキー情報を取得
			const stickyAfter = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// StickyのmessageIdが更新されないことを検証
			expect(stickyAfter).to.not.be.null;
			expect(String(stickyAfter?.messageId)).to.eq(String(messageId));
			expect(String(stickyAfter?.messageId)).to.eq(String(stickyBefore?.messageId));
		})();
	});

	/**
	 * [スティッキーなし] スティッキーが登録されていないチャンネルでは何も起こらない
	 * - スティッキーが存在しない場合、処理が中断されることを検証
	 */
	it("should do nothing when channel has no sticky registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 通常のユーザーからのメッセージをモック作成
			const messageMock = mockMessage(userId, false, false); // isBotMessage = false

			// guildIdとchannelIdを設定
			when(messageMock.guildId).thenReturn(guildId);
			when(messageMock.channelId).thenReturn(channelId);

			// チャンネルをモック - 通常のチャンネルとして設定
			const channelMock = mock<TextChannel>();
			when(channelMock.isThread()).thenReturn(false); // 通常のチャンネル
			when(messageMock.channel).thenReturn(instance(channelMock));

			// TestDiscordServerを使用してmessageCreateイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageCreate", instance(messageMock));

			// 処理が完了するまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 何も起こらないのでテストなし
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// テスト前のスティッキー情報を取得
			const stickyBefore = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// 通常のユーザーからのメッセージをモック作成
			const messageMock = mockMessage(userId, false, false); // isBotMessage = false

			// guildIdとchannelIdを設定
			when(messageMock.guildId).thenReturn(guildId);
			when(messageMock.channelId).thenReturn(channelId);

			// チャンネルをモック - 通常のチャンネルとして設定
			const channelMock = mock<TextChannel>();
			when(channelMock.isThread()).thenReturn(false); // 通常のチャンネル
			when(messageMock.channel).thenReturn(instance(channelMock));

			// guildをモック - チャンネルが存在しないように設定
			const guildMock = {
				channels: {
					cache: {
						get: (id: string) => {
							// チャンネルが存在しないのでundefinedを返す
							return undefined;
						},
					},
				},
			};
			when(messageMock.guild).thenReturn(guildMock as any);

			// TestDiscordServerを使用してmessageCreateイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageCreate", instance(messageMock));

			// 処理が完了するまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// テスト後のスティッキー情報を取得
			const stickyAfter = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// StickyのmessageIdが更新されないことを検証
			expect(stickyAfter).to.not.be.null;
			expect(String(stickyAfter?.messageId)).to.eq(String(messageId));
			expect(String(stickyAfter?.messageId)).to.eq(String(stickyBefore?.messageId));
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			});

			// テスト前のスティッキー情報を取得
			const stickyBefore = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// 通常のユーザーからのメッセージをモック作成
			const messageMock = mockMessage(userId, false, false); // isBotMessage = false

			// guildIdとchannelIdを設定
			when(messageMock.guildId).thenReturn(guildId);
			when(messageMock.channelId).thenReturn(channelId);

			// チャンネルをモック - 通常のチャンネルとして設定
			const channelMock = mock<TextChannel>();
			when(channelMock.isThread()).thenReturn(false); // 通常のチャンネル
			when(messageMock.channel).thenReturn(instance(channelMock));

			// guildをモック - TextChannel以外のチャンネルを返すように設定
			const nonTextChannelMock = {}; // TextChannelではないオブジェクト
			const guildMock = {
				channels: {
					cache: {
						get: (id: string) => {
							// TextChannelではないチャンネルを返す
							return nonTextChannelMock;
						},
					},
				},
			};
			when(messageMock.guild).thenReturn(guildMock as any);

			// TestDiscordServerを使用してmessageCreateイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageCreate", instance(messageMock));

			// 処理が完了するまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// テスト後のスティッキー情報を取得
			const stickyAfter = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// StickyのmessageIdが更新されないことを検証
			expect(stickyAfter).to.not.be.null;
			expect(String(stickyAfter?.messageId)).to.eq(String(messageId));
			expect(String(stickyAfter?.messageId)).to.eq(String(stickyBefore?.messageId));
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
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const oldMessageId = "4";
			const newMessageId = "5";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: oldMessageId,
				message: message,
			});

			// 通常のユーザーからのメッセージをモック作成
			const messageMock = mockMessage(userId, false, false); // isBotMessage = false

			// 古いメッセージのモック - 削除が成功するケース
			let deleteWasCalled = false;
			const oldMessageMock = {
				guildId: guildId,
				channelId: channelId,
				id: oldMessageId,
				content: message,
				delete: () => {
					deleteWasCalled = true;
					return Promise.resolve(true);
				},
			};

			// 新しいメッセージのモック
			const newMessageMock = {
				guildId: guildId,
				channelId: channelId,
				id: newMessageId,
				content: message,
			};

			// チャンネルをモック - 通常のチャンネルとして設定
			const channelMock = mock<TextChannel>();
			when(channelMock.isThread()).thenReturn(false); // 通常のチャンネル
			when(channelMock.send(anything())).thenResolve(newMessageMock as any);
			when(channelMock.messages).thenReturn({
				fetch: (id: string) => {
					return Promise.resolve(oldMessageMock);
				},
			} as any);
			when(messageMock.channel).thenReturn(instance(channelMock));

			// guildIdとchannelIdを設定
			when(messageMock.guildId).thenReturn(guildId);
			when(messageMock.channelId).thenReturn(channelId);
			// guildのモックを設定
			when(messageMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => channelMock,
					},
				},
			} as any);

			// guildをモック - TextChannelを返すように設定
			const guildMock = {
				channels: {
					cache: {
						get: (id: string) => {
							// TextChannelのインスタンスとして認識される
							const textChannel = Object.create(TextChannel.prototype);
							// 必要なメソッドをモック
							textChannel.send = () => Promise.resolve(newMessageMock);
							textChannel.messages = { fetch: () => Promise.resolve(oldMessageMock) };
							// 必要なプロパティを追加
							textChannel.id = id;
							textChannel.type = 0; // TextChannelのtype
							return textChannel;
						},
					},
				},
			};
			when(messageMock.guild).thenReturn(guildMock as any);

			// TestDiscordServerを使用してmessageCreateイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageCreate", instance(messageMock));

			// 処理が完了するまで少し待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// テスト後のスティッキー情報を取得
			const stickyAfter = await StickyRepositoryImpl.findOne({
				where: {
					guildId: guildId,
					channelId: channelId,
				},
			});

			// message.delete()が呼ばれるを検証
			expect(deleteWasCalled).to.eq(true);

			// StickyのmessageIdが更新されたことを検証
			expect(String(stickyAfter?.messageId)).to.eq(String(newMessageId));
		})();
	});
});
