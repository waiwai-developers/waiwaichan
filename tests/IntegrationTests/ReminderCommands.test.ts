import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test Reminder Commands", () => {
	test("test /reminderset datetime:2999/12/31 23:59:59 message:feature reminder", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: "2999/12/31 23:59:59",
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドの投稿を予約したよ！っ")).once();
		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).toBe(1);

		expect(res[0].id).toBe(1);
		expect(res[0].userId).toBe(1234);
		expect(res[0].channelId).toBe(5678);
		expect(res[0].message).toBe("test reminder");
	});

	test("test /reminderset when old datetime", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: "1000/12/31 23:59:59",
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("過去の日付のリマインドは設定できないよ！っ")).once();
	});

	test("test /reminderset with null datetime", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: null,
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("test /reminderset with null message", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: "2999/12/31 23:59:59",
			message: null,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("test /reminderlist with no remind", async () => {
		const commandMock = mockSlashCommand("reminderlist");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドは予約されていないよ！っ")).once();
	});

	test("test /reminderlist when remind contain", async () => {
		new MysqlConnector();
		await ReminderRepositoryImpl.bulkCreate([
			{
				userId: 1234,
				channelId: 5678,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				userId: 1234,
				channelId: 5678,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
		]);
		const commandMock = mockSlashCommand("reminderlist");
		let res = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			res = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドは予約されていないよ！っ")).never();
		verify(commandMock.reply(InternalErrorMessage)).never();

		expect(res).toBe(
			"- id: 1\n" + "  - 3000-01-01 08:59:59\n" + "  - reminderlist test 1\n" + "- id: 2\n" + "  - 3000-01-01 08:59:59\n" + "  - reminderlist test 2",
		);
	});

	test("test /reminderdelete when id exist", async () => {
		new MysqlConnector();
		const [forDeleteObj, forNotDeleteObjSameUserId, forNotDeleteObjDifferentUserId] = await ReminderRepositoryImpl.bulkCreate([
			{
				userId: 1234,
				channelId: 5678,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				userId: 1234,
				channelId: 5678,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				userId: 9012,
				channelId: 3456,
				receiveUserName: "username",
				message: "reminderlist test 3",
				remindAt: "2000/12/31 23:59:59",
			},
		]);

		const commandMock = mockSlashCommand("reminderdelete", {
			id: forDeleteObj.id,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("リマインドの予約を削除したよ！っ")).once();

		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).toBe(2);

		expect(res[0].id).toBe(forNotDeleteObjSameUserId.id);
		expect(res[0].userId).toBe(forNotDeleteObjSameUserId.userId);
		expect(res[0].channelId).toBe(forNotDeleteObjSameUserId.channelId);
		expect(res[0].message).toBe(forNotDeleteObjSameUserId.message);

		expect(res[1].id).toBe(forNotDeleteObjDifferentUserId.id);
		expect(res[1].userId).toBe(forNotDeleteObjDifferentUserId.userId);
		expect(res[1].channelId).toBe(forNotDeleteObjDifferentUserId.channelId);
		expect(res[1].message).toBe(forNotDeleteObjDifferentUserId.message);
	});

	test("test /reminderdelete when different user id", async () => {
		new MysqlConnector();
		const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
			{
				userId: 9012,
				channelId: 5678,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				userId: 1234,
				channelId: 5678,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				userId: 9012,
				channelId: 3456,
				receiveUserName: "username",
				message: "reminderlist test 3",
				remindAt: "2000/12/31 23:59:59",
			},
		]);

		const commandMock = mockSlashCommand("reminderdelete", {
			id: inserted0.id,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("リマインドの予約はされていなかったよ！っ")).once();

		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).toBe(3);

		expect(res[0].id).toBe(inserted0.id);
		expect(res[0].userId).toBe(inserted0.userId);
		expect(res[0].channelId).toBe(inserted0.channelId);
		expect(res[0].message).toBe(inserted0.message);

		expect(res[1].id).toBe(inserted1.id);
		expect(res[1].userId).toBe(inserted1.userId);
		expect(res[1].channelId).toBe(inserted1.channelId);
		expect(res[1].message).toBe(inserted1.message);

		expect(res[2].id).toBe(inserted2.id);
		expect(res[2].userId).toBe(inserted2.userId);
		expect(res[2].channelId).toBe(inserted2.channelId);
		expect(res[2].message).toBe(inserted2.message);
	});

	test("test /reminderdelete when id not exist", async () => {
		const commandMock = mockSlashCommand("reminderdelete", {
			id: 0,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("リマインドの予約はされていなかったよ！っ")).once();
	});

	test("test /reminderdelete when id is null", async () => {
		const commandMock = mockSlashCommand("reminderdelete", {
			id: null,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	afterEach(async () => {
		await ReminderRepositoryImpl.destroy({
			truncate: true,
		});
	});
});
