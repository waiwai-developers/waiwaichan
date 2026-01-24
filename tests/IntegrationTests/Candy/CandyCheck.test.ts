import "reflect-metadata";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type Mocha from "mocha";
import { anything, instance, verify } from "ts-mockito";

import { type TestContext, createCandyData, setupCommandMockReply, setupTestEnvironment, teardownTestEnvironment } from "./CandyHelper.test";

describe("Test Candy Check Commands", () => {
	let testCommunityId: number;
	let testUserId: number;
	let testGiveUserId: number;
	let testReceiverUserId: number;

	beforeEach(async () => {
		const context: TestContext = await setupTestEnvironment();
		testCommunityId = context.communityId;
		testUserId = context.userId;
		testGiveUserId = context.giveUserId;
		testReceiverUserId = context.receiverUserId;
	});

	afterEach(async () => {
		await teardownTestEnvironment();
	});

	/**
	 * キャンディ所持時の/candycheckコマンドをテスト
	 * キャンディを所持している場合、個数と期限が正しく表示されることを確認する
	 */
	it("should display candy count and expiration when candies exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candycheck");

			const insertData = createCandyData({
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.create(insertData);

			const { getValue } = setupCommandMockReply(commandMock);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();
			expect(getValue()).to.eq("キャンディが1個あるよ！期限が2999/12/30に切れるから気を付けてね！っ");
		})();
	});

	/**
	 * キャンディ未所持時の/candycheckコマンドをテスト
	 * キャンディを所持していない場合、適切なメッセージが表示されることを確認する
	 */
	it("should display message when no candies exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candycheck");

			const { getValue } = setupCommandMockReply(commandMock);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();
			expect(getValue()).to.include("キャンディがないよ！っ");
		})();
	});
});
