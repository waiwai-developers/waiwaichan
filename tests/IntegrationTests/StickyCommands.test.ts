import "reflect-metadata";
import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { StickyDto } from "@/src/entities/dto/StickyDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import { StickyCreateCommandHandler } from "@/src/handlers/discord.js/commands/StickyCreateCommandHandler";
import { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import { StickyLogic } from "@/src/logics/StickyLogic";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { expect } from "chai";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { type ActionRowBuilder, type ModalBuilder, TextChannel, type TextInputBuilder, TextInputStyle } from "discord.js";
import { Container } from "inversify";
import type Mocha from "mocha";
import { anything, instance, mock, verify, when } from "ts-mockito";
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
});
