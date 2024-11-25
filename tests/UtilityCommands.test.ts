import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import {
	mockSlashCommand,
	waitUntilReply,
} from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test UtilityCommand", () => {
	test("Test /help category:all", async () => {
		const commandMock = mockSlashCommand("help", {
			category: "all",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).never();
	});

	test("Test /help category:mainコマンド", async () => {
		const commandMock = mockSlashCommand("help", {
			category: "mainコマンド",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).never();
	});

	test("Test /help category:null", async () => {
		const commandMock = mockSlashCommand("help");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /waiwai", async () => {
		const commandMock = mockSlashCommand("waiwai");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("waiwai")).once();
	});

	test("Test /parrot message:あああああ", async () => {
		const message = "あああああ";
		const commandMock = mockSlashCommand("parrot", {
			message: message,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(message)).once();
	});

	test("Test /parrot message:null", async () => {
		const commandMock = mockSlashCommand("parrot");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /dice parameter:ramdom", async () => {
		for (let i = 0; i < 10; i++) {
			const sides = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

			const commandMock = mockSlashCommand("dice", {
				parameter: sides,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = 0;
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).never();
			expect(Number(value)).toBeLessThanOrEqual(sides);
		}
	}, 20_000);

	test("Test /dice parameter:null", async () => {
		const commandMock = mockSlashCommand("dice", {
			parameter: null,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let value = 0;
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /dice parameter:3.14159265", async () => {
		const commandMock = mockSlashCommand("dice", {
			parameter: Math.PI,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let value = 0;
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("パラメーターが整数じゃないよ！っ")).once();
	});
});
