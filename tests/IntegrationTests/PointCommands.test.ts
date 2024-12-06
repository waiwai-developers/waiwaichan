import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { ID_HIT, ID_JACKPOT } from "@/src/entities/constants/Items";
import { PointRepositoryImpl, UserPointItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import dayjs from "dayjs";
import { type MessageReactionEventDetails, Status } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Point Commands", () => {
	test("test  adding", async () => {
		const giverId = "1234";
		const receiverId = "5678";
		const creationDate = dayjs().add(1, "month").subtract(1, "second");
		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		await waitUntilMessageReply(messageMock);

		verify(messageMock.reply(anything())).once();
		verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).once();

		new MysqlConnector();
		const res = await PointRepositoryImpl.findAll();
		expect(res.length).toEqual(1);

		expect(String(res[0].giveUserId)).toBe(giverId);
		expect(String(res[0].receiveUserId)).toBe(receiverId);

		const finishedDate = dayjs().add(1, "month").add(1, "second");

		expect(creationDate.isBefore(dayjs(res[0].expiredAt))).toBe(true);
		expect(finishedDate.isAfter(dayjs(res[0].expiredAt))).toBe(true);
	});

	test("test  adding limit", async () => {
		const reaction = mockReaction(AppConfig.backend.pointEmoji, "1234", "5678");
		const TEST_CLIENT = await TestDiscordServer.getClient();
		for (let i = 0; i < 4; i++) {
			when(reaction.messageMock.id).thenReturn(String(i));
			when(reaction.reaction.message).thenReturn(instance(reaction.messageMock));
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction.reaction), instance(reaction.user), instance(mock<MessageReactionEventDetails>()));
		}

		await waitUntilMessageReply(reaction.messageMock, 15_000, 4);

		verify(reaction.messageMock.reply(anything())).times(4);
		verify(reaction.messageMock.reply(`<@${instance(reaction.user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).times(3);
		verify(reaction.messageMock.reply("今はスタンプを押してもポイントをあげられないよ！っ")).times(1);

		new MysqlConnector();
		const res = await PointRepositoryImpl.findAll();
		expect(res.length).toEqual(3);
	});

	test("test  not add same user", async () => {
		const giverId = "1234";
		const receiverId = "1234";

		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		try {
			await waitUntilMessageReply(messageMock, 300);
		} catch (e) {
			verify(messageMock.reply(anything())).never();
			return;
		}
		expect("expect not reach here").toBe(false);
	});

	test("test  not adding for same message", async () => {
		const giverId = "1234";
		const receiverId = "5678";
		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, giverId, receiverId);

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		await new Promise((resolve) => setTimeout(resolve, 1000));

		verify(messageMock.reply(anything())).once();
		verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).once();
	});

	test("test /pointcheck when points exists", async () => {
		new MysqlConnector();
		const insertData = new Array(Math.round(Math.random() * 100)).fill({
			receiveUserId: 1234,
			giveUserId: 12345,
			messageId: 5678,
			expiredAt: "2999/12/31 23:59:59",
			deletedAt: null,
		});
		const inserted = await PointRepositoryImpl.bulkCreate(insertData);
		const commandMock = mockSlashCommand("pointcheck");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(`${inserted.length}ポイントあるよ！っ`)).once();
	});

	test("test /pointcheck when no points", async () => {
		const commandMock = mockSlashCommand("pointcheck");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("ポイントがないよ！っ")).once();
	});

	test("test /pointdraw", async () => {
		// P = 1-(1-p)^n
		// → 0.9999(99.99%) = 1-(1-0.01(1%))^n
		// → n = log(1-0.9999)/log(1-0.01) = 916.421 ≒ 917
		const pointLength = 917;
		const insertData = new Array(pointLength).fill({
			receiveUserId: 1234,
			giveUserId: 12345,
			messageId: 5678,
			expiredAt: "2999/12/31 23:59:59",
			deletedAt: null,
		});
		new MysqlConnector();
		await PointRepositoryImpl.bulkCreate(insertData);

		const commandMock = mockSlashCommand("pointdraw");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		// +1 is checking for atomic
		for (let i = 0; i < pointLength + 1; i++) {
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		}
		await waitSlashUntilReply(commandMock, 10_000, pointLength);
		verify(commandMock.reply(anything())).times(pointLength + 1);
		verify(commandMock.reply("ポイントがないよ！っ")).once();
		verify(commandMock.reply("ハズレちゃったよ！っ")).atLeast(1);
		verify(commandMock.reply("ハズレちゃったよ！っ")).atMost(pointLength);
		const hitResult = `${ITEM_RECORDS[1].name}が当たったよ🍭！っ`;
		verify(commandMock.reply(hitResult)).atLeast(1);
		const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
		verify(commandMock.reply(jackpotResult)).atLeast(1);
	}, 10_000);

	const getItem = (id: number) => {
		// auto_increment start with id 1
		// but first index of array is 0
		return ITEM_RECORDS[id - 1];
	};

	test("test /pointitem", async () => {
		new MysqlConnector();
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
		const inserted = await UserPointItemRepositoryImpl.bulkCreate(insertData);

		const commandMock = mockSlashCommand("pointitem");

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).toBe(
			[
				"以下のアイテムが交換できるよ！っ",
				"- id: 1",
				`  - ${getItem(inserted[0].itemId).name}`,
				`  - ${getItem(inserted[0].itemId).description}`,
				"- id: 2",
				`  - ${getItem(inserted[1].itemId).name}`,
				`  - ${getItem(inserted[1].itemId).description}`,
				"- id: 5",
				`  - ${getItem(inserted[4].itemId).name}`,
				`  - ${getItem(inserted[4].itemId).description}`,
			].join("\n"),
		);
	});

	test("test /pointitem when no item", async () => {
		new MysqlConnector();

		const commandMock = mockSlashCommand("pointitem");

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).toBe("アイテムは持ってないよ！っ");
	});

	const setupUserPointItemData = async () => {
		new MysqlConnector();
		return UserPointItemRepositoryImpl.bulkCreate([
			{
				// exchangeable
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
			},
			{
				// used
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: "1970/01/01 00:00:00",
			},
			{
				// expired
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "1970/1/1 00:00:00",
				deletedAt: null,
			},

			{
				// expired used
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "1970/1/1 00:00:00",
			},
		]);
	};

	test("test /pointchange", async () => {
		const [insert0, insert1, insert2, insert3] = await setupUserPointItemData();

		const commandMock = mockSlashCommand("pointchange", {
			id: insert0.id,
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).not.toBe("アイテムは持ってないよ！っ");
		expect(value).toBe(`${ITEM_RECORDS[insert0.itemId - 1].name}と交換したよ！っ`);

		const res = await UserPointItemRepositoryImpl.findAll();
		expect(res.length).toBe(1);
		expect(res[0].id).toBe(insert2.id);
	});

	test("test /pointchange when no item", async () => {
		const commandMock = mockSlashCommand("pointchange", {
			id: 0,
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		expect(value).toBe("アイテムは持ってないよ！っ");
	});

	afterEach(async () => {
		await PointRepositoryImpl.destroy({
			truncate: true,
		});
		await UserPointItemRepositoryImpl.destroy({
			truncate: true,
		});
	});
});
