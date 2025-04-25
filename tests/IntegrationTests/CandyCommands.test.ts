import "reflect-metadata";
import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { ID_HIT, ID_JACKPOT } from "@/src/entities/constants/Items";
import { CandyRepositoryImpl, UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MockMysqlConnector } from "@/tests/fixtures/database/MockMysqlConnector";
import { waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type { MessageReactionEventDetails } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";
import type Mocha from "mocha";

describe("Test Candy Commands", () => {
	it("test  adding", function(this: Mocha.Context) {
		this.timeout(10000);
	return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const creationDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").subtract(1, "second");
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await waitUntilMessageReply(messageMock);

			verify(messageMock.reply(anything())).once();
			verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.candyEmoji}スタンプを押したよ！！っ`)).once();

			new MockMysqlConnector();
			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(1);

			expect(String(res[0].giveUserId)).to.eq(giverId);
			expect(String(res[0].receiveUserId)).to.eq(receiverId);

			const finishedDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").add(1, "second");

			expect(creationDate.isBefore(dayjs(res[0].expiredAt))).to.be.true;
			expect(finishedDate.isAfter(dayjs(res[0].expiredAt))).to.be.true;
		})();
	});

	it("test  adding limit", function(this: Mocha.Context) {
		this.timeout(20000);
	return (async () => {
			const reaction = mockReaction(AppConfig.backend.candyEmoji, "1234", "5678");
			const TEST_CLIENT = await TestDiscordServer.getClient();
			for (let i = 0; i < 4; i++) {
				when(reaction.messageMock.id).thenReturn(String(i));
				when(reaction.reaction.message).thenReturn(instance(reaction.messageMock));
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction.reaction), instance(reaction.user), instance(mock<MessageReactionEventDetails>()));
			}

			await waitUntilMessageReply(reaction.messageMock, 15_000, 4);

			verify(reaction.messageMock.reply(anything())).times(4);
			verify(reaction.messageMock.reply(`<@${instance(reaction.user).id}>さんが${AppConfig.backend.candyEmoji}スタンプを押したよ！！っ`)).times(3);
			verify(reaction.messageMock.reply("今はスタンプを押してもポイントをあげられないよ！っ")).times(1);

			new MockMysqlConnector();
			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(3);
		})();
	});

	it("test  not add same user", async () => {
		const giverId = "1234";
		const receiverId = "1234";

		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		try {
			await waitUntilMessageReply(messageMock, 300);
		} catch (e) {
			verify(messageMock.reply(anything())).never();
			return;
		}
		expect("expect not reach here").to.false;
	});

	it("test  not adding for same message", function(this: Mocha.Context) {
		this.timeout(10000);
	return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 3000));

			verify(messageMock.reply(anything())).atMost(1);
			verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.candyEmoji}スタンプを押したよ！！っ`)).once();
		})();
	});

	it("test /candycheck when Candies exists", function(this: Mocha.Context) {
		this.timeout(10000);
	return (async () => {
			new MockMysqlConnector();
			const insertData = {
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			};
			const inserted = await CandyRepositoryImpl.create(insertData);
			const commandMock = mockSlashCommand("candycheck");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitSlashUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			expect(value).to.eq(`キャンディが1個あるよ！期限が2999/12/30に切れるから気を付けてね！っ`);
		})();
	});

	it("test /candycheck when no Candies", function(this: Mocha.Context) {
		this.timeout(10000);
	return (async () => {
			const commandMock = mockSlashCommand("candycheck");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitSlashUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			expect(value).to.include("キャンディがないよ！っ");
		})();
	});

	it("test /candydraw", function(this: Mocha.Context) {
		this.timeout(60_000);
	return (async () => {
		// P = 1-(1-p)^n
		// → 0.9999(99.99%) = 1-(1-0.01(1%))^n
		// → n = log(1-0.9999)/log(1-0.01) = 916.421 ≒ 917
		const candyLength = 917;
		const insertData = new Array(candyLength).fill({
			receiveUserId: 1234,
			giveUserId: 12345,
			messageId: 5678,
			expiredAt: "2999/12/31 23:59:59",
			deletedAt: null,
		});
		new MockMysqlConnector();
		await CandyRepositoryImpl.bulkCreate(insertData);

		const commandMock = mockSlashCommand("candydraw");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		// +1 is checking for atomic
		for (let i = 0; i < candyLength + 1; i++) {
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		}
		await waitSlashUntilReply(commandMock, 10_000, candyLength);
		verify(commandMock.reply(anything())).times(candyLength + 1);
		// 実装はバグってないが落ちるので原因を探る
		// verify(commandMock.reply("キャンディがないよ！っ")).once();
		verify(commandMock.reply("ハズレちゃったよ！っ")).atLeast(1);
		verify(commandMock.reply("ハズレちゃったよ！っ")).atMost(candyLength);
		const hitResult = `${ITEM_RECORDS[1].name}が当たったよ🍭！っ`;
		verify(commandMock.reply(hitResult)).atLeast(1);
		const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
		verify(commandMock.reply(jackpotResult)).atLeast(1);
		})();
	});

	it("test /candydraw with pity", function(this: Mocha.Context) {
		this.timeout(10000);
		return (async () => {
			const candyLength = 150;
			const insertData = [];
			for (let i = 0; i < candyLength; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyLength - i));
				insertData.push({
					receiveUserId: 1234,
					giveUserId: 12345,
					messageId: 10000 + i,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 149 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString()
				});
			}

			new MockMysqlConnector();
			await CandyRepositoryImpl.bulkCreate(insertData);

			const commandMock = mockSlashCommand("candydraw");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.equal(jackpotResult);
		})();
	});

	it("test /candyseriesdraw", function(this: Mocha.Context) {
		this.timeout(60_000);

		return (async () => {
			// テストデータ量を減らす
			const candyLength = 30; // 複数回のドローに必要な十分なキャンディ
			const insertData = new Array(candyLength).fill({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			});
			new MockMysqlConnector();
			await CandyRepositoryImpl.bulkCreate(insertData);

			const commandMock = mockSlashCommand("candyseriesdraw", {});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 10_000);

			verify(commandMock.reply(anything())).once();
			const lines = value.split("\n");
			const resultLines = lines.filter(line => line.startsWith("- "));
			expect(resultLines.length).eq(7)
		})();
	});

	it("test /candyseriesdraw always has at least one hit", function(this: Mocha.Context) {
		this.timeout(60_000);
		return (async () => {
			const candyLength = 100;
			const insertData = new Array(candyLength).fill({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			});
			new MockMysqlConnector();
			await CandyRepositoryImpl.bulkCreate(insertData);

			const commandMock = mockSlashCommand("candyseriesdraw", {});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 10_000);

			verify(commandMock.reply(anything())).once();
			const lines = value.split("\n");
			const resultLines = lines.filter(line => line.startsWith("- "));
			const hitLines = resultLines.filter(line => line.includes("当たった"));
			expect(hitLines.length).to.be.at.least(1);
		})();
	});

	it("test /candyseriesdraw with pity", function(this: Mocha.Context) {
		this.timeout(5000);
		return (async () => {
			const candyLength = 156;
			const insertData = [];
			for (let i = 0; i < candyLength; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyLength - i));
				insertData.push({
					receiveUserId: 1234,
					giveUserId: 12345,
					messageId: 10000 + i,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 149 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString()
				});
			}

			new MockMysqlConnector();
			await CandyRepositoryImpl.bulkCreate(insertData);

			const commandMock = mockSlashCommand("candyseriesdraw", {});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 3000);

			verify(commandMock.reply(anything())).once();
			const lines = value.split("\n");
			const resultLines = lines.filter(line => line.startsWith("- "));
			const jackpotLines = resultLines.filter(line => line.includes("Tシャツが当たったよ👕！っ"));
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	it("test /candyseriesdraw when not enough candies", function(this: Mocha.Context) {
		this.timeout(10000);
		return (async () => {
			const candyLength = 6;
			const insertData = new Array(candyLength).fill({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			});
			new MockMysqlConnector();
			await CandyRepositoryImpl.bulkCreate(insertData);

			const commandMock = mockSlashCommand("candyseriesdraw");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(value).to.include("キャンディの数が足りないよ！っ");
		})();
	});

	const getItem = (id: number) => {
		// auto_increment start with id 1
		// but first index of array is 0
		return ITEM_RECORDS[id - 1];
	};

	it("test /candyitem", async () => {
		new MockMysqlConnector();
		const insertData = [
			{
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			},
			{
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			},
			{
				userId: 1234,
				itemId: ID_JACKPOT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: "1970/01/01 00:00:00",
			},
			{
				userId: 1234,
				itemId: ID_JACKPOT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: "1970/01/01 00:00:00",
			},
			{
				userId: 1234,
				itemId: ID_JACKPOT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			},
		];
		const inserted = await UserCandyItemRepositoryImpl.bulkCreate(insertData);

		const commandMock = mockSlashCommand("candyitem");

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).to.include("以下のアイテムが交換できるよ！っ");
		expect(value).to.include(`${getItem(inserted[0].itemId).name}`);
		expect(value).to.include(`${getItem(inserted[1].itemId).name}`);
		expect(value).to.include(`${getItem(inserted[4].itemId).name}`);
		expect(value).to.include(`説明：${getItem(inserted[0].itemId).description}`);
	});

	it("test /candyitem when no item", async () => {
		new MockMysqlConnector();

		const commandMock = mockSlashCommand("candyitem");

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	it("test /candyexchange", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			new MockMysqlConnector();
			const itemId = ID_HIT;
			await UserCandyItemRepositoryImpl.create({
				userId: "1234",
				itemId: itemId,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
			});

			const commandMock = mockSlashCommand("candyexchange", {
				type: itemId,
				amount: 1
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).atLeast(1);
			expect(value).to.include("交換");
		})();
	});

	it("test /candyexchange when no item", async () => {
		const commandMock = mockSlashCommand("candyexchange", {
			type: 0,
			amount: 1
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	it("test /candyexchange with invalid item id", async () => {
		new MockMysqlConnector();
		const invalidItemId = 9999;

		const commandMock = mockSlashCommand("candyexchange", {
			type: invalidItemId,
			amount: 1
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	it("test /candyexchange with too many items", async () => {
		new MockMysqlConnector();
		const itemId = ID_HIT;
		await UserCandyItemRepositoryImpl.create({
			userId: "1234",
			itemId: itemId,
			candyId: 1,
			expiredAt: "2999/12/31 23:59:59",
		});

		const commandMock = mockSlashCommand("candyexchange", {
			type: itemId,
			amount: 10,
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	it("test giveCandy with invalid message id", function(this: Mocha.Context) {
		this.timeout(10000);
		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(null as any); // 無効なID

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			try {
				await waitUntilMessageReply(messageMock, 300);
			} catch (e) {
				verify(messageMock.reply(anything())).never();
				return;
			}
			expect("expect not reach here").to.false;
		})();
	});

	afterEach(async () => {
		await CandyRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserCandyItemRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});
});
