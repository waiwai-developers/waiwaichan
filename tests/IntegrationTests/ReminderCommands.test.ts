import { migrator } from "@/migrator/umzug";
import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import {
	mockSlashCommand,
	waitUntilReply,
} from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import {
	MySqlContainer,
	type StartedMySqlContainer,
} from "@testcontainers/mysql";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test Reminder Commands", () => {
	let container: StartedMySqlContainer;
	beforeAll(async () => {
		container = await new MySqlContainer()
			.withDatabase(DatabaseConfig.test.database)
			.withRootPassword(DatabaseConfig.test.password)
			.start();
		DatabaseConfig.test = {
			host: container.getHost(),
			port: container.getPort(),
			username: container.getUsername(),
			password: container.getUserPassword(),
			database: container.getDatabase(),
			dialect: "mysql",
		};
		await migrator(DatabaseConfig.test).up();
	}, 60_000);
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

	afterAll(async () => {
		await container.stop({
			remove: true,
			removeVolumes: true,
		});
	});
});
