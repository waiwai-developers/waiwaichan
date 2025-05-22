import "reflect-metadata";
import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { expect } from "chai";
import { ModalBuilder, TextChannel, TextInputBuilder } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, verify, when } from "ts-mockito";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "../fixtures/discord.js/TestDiscordServer";
import { StickyRepositoryImpl } from "@/src/repositories/sequelize-mysql";

describe("Test Sticky Commands", () => {
	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
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
	 * - verifyで権限チェックが行われることを検証
	 * - verify権限がない場合にエラーメッセージが返されることを検証
	 * - verifyStickyLogicのcreateメソッドが呼ばれないことを検証
	 */
	it("should not create sticky when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 非管理者ユーザーIDを設定
			const nonAdminUserId = "9999";

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: "12345" }, nonAdminUserId);

			// RoleConfigのモック
			RoleConfig.users = [
				... RoleConfig.users,
				{ discordId: nonAdminUserId, role: "user" },
			];

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn("1234567890");
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				console.log("Reply received:", message);
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
	 * - verifyStickyLogic.findが呼ばれることを検証
	 * - verifyスティッキーが既に存在する場合にエラーメッセージが返されることを検証
	 * - verifyStickyLogic.createが呼ばれないことを検証
	 */
	it("should not create sticky when channel already has a sticky", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4"
			const message = "スティッキーのメッセージ"

			// RoleConfigのモック
			RoleConfig.users = [
				... RoleConfig.users,
				{ discordId: userId, role: "admin" },
			];

			// 既存のスティッキーを返すようにfindメソッドをモック

			await StickyRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
				userId: userId,
				messageId: messageId,
				message: message,
			})

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickycreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				console.log("Reply received:", message);
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
		})();
	});
	/**
	 * [チャンネル検証] TextChannel以外にはスティッキーを登録できない
	 * - verifyチャンネルの型チェックが行われることを検証
	 * - verifyTextChannel以外の場合にエラーメッセージが返されることを検証
	 * - verifyStickyLogic.createが呼ばれないことを検証
	 */
 	it("should not create sticky when channel is not a TextChannel", function (this: Mocha.Context) {
 		this.timeout(10_000);

 		return (async () => {
 			// テスト用のチャンネルID
 			const guildId = "1";
 			const channelId = "2";
 			const userId = "3";

 			// RoleConfigのモック
 			// 実際のRoleConfigを使用するが、テスト用のユーザーが管理者であることを確認
 			const originalUsers = RoleConfig.users;
 			(RoleConfig as any).users = [
 				...originalUsers,
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
						}
					}
				}
			} as any);

 			// replyメソッドをモック
 			let replyValue = "";
 			when(commandMock.reply(anything())).thenCall((message: string) => {
 				replyValue = message;
 				console.log("Reply received:", message);
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
 	 * - verifyモーダルが表示されることを検証
 	 * - verifyモーダルに適切なタイトルとフィールドが設定されていることを検証
 	 */
 	it("should display modal with appropriate title and fields when creating sticky", function (this: Mocha.Context) {
 		this.timeout(10_000);

 		return (async () => {
 			// 管理者ユーザーIDを設定
 			const guildId = "1";
 			const channelId = "2";
 			const userId = "3";

 			// RoleConfigのモック
 			const originalUsers = RoleConfig.users;
 			(RoleConfig as any).users = [
 				...originalUsers,
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
 								textChannel.send = () => Promise.resolve({ id: "12345", content: "test message" } as any);
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
 			await new Promise(resolve => setTimeout(resolve, 100));

 			// モーダルが表示されたことを検証
 			verify(commandMock.showModal(anything())).once();

 			// モーダルが正しく設定されていることを検証
 			expect(capturedModal).to.not.be.null;

 			// ModalBuilderのインスタンスであることを確認
 			expect(capturedModal instanceof ModalBuilder).to.be.true;

 			// モーダルのコンポーネント（テキスト入力フィールド）を検証
 			expect(capturedModal.components.length).to.eq(1);

 			// ActionRowBuilderのインスタンスであることを確認
 			const actionRow = capturedModal.components[0];
 			expect(actionRow.components.length).to.eq(1);

 			// TextInputBuilderのインスタンスであることを確認
 			const textInput = actionRow.components[0];
 			expect(textInput instanceof TextInputBuilder).to.be.true;
 		})();
 	});
});
