import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import {
	mockSlashCommand,
	waitUntilReply,
} from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test Reminder Commands", () => {
	test("test /reminderset datetime:2999/12/31 23:59:59 message:feature reminder", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			datetime: "2999/12/31 23:59:59",
			message: "test reminder",
		});
		when(commandMock.reply(anything())).thenCall((args) => {
			console.log(args);
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

	test("test /reminderlist with no remind", async () => {
		const commandMock = mockSlashCommand("reminderlist");
		when(commandMock.reply(anything())).thenCall((args) => {
			console.log(args);
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドは予約されていないよ！っ")).once();
	});

	afterEach(() => {
		ReminderRepositoryImpl.destroy({
			truncate: true,
		});
	});
});
