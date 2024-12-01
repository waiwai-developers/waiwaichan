import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test UtilityCommand", () => {
	test.concurrent("Test /help category:all", async () => {
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

	test.concurrent("Test /help category:mainコマンド", async () => {
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

	test.concurrent("Test /help category:null", async () => {
		const commandMock = mockSlashCommand("help");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test.concurrent("Test /waiwai", async () => {
		const commandMock = mockSlashCommand("waiwai");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("waiwai")).once();
	});

	test.concurrent("Test /parrot message:あああああ", async () => {
		const message = "あああああ";
		const commandMock = mockSlashCommand("parrot", {
			message: message,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(message)).once();
	});

	test.concurrent("Test /parrot message:null", async () => {
		const commandMock = mockSlashCommand("parrot");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test.concurrent(
		"Test /dice parameter:ramdom",
		async () => {
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = 0;
			for (let i = 0; i < 10; i++) {
				const sides = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
				const commandMock = mockSlashCommand("dice", {
					parameter: sides,
				});

				when(commandMock.reply(anything())).thenCall((args) => {
					value = args;
				});

				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
				await waitUntilReply(commandMock);
				verify(commandMock.reply(anything())).once();
				verify(commandMock.reply(InternalErrorMessage)).never();
				expect(Number(value)).toBeLessThanOrEqual(sides);
			}
		},
		20_000,
	);

	test.concurrent("Test /dice parameter:null", async () => {
		const commandMock = mockSlashCommand("dice", {
			parameter: null,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test.concurrent("Test /dice parameter:3.14159265", async () => {
		const commandMock = mockSlashCommand("dice", {
			parameter: Math.PI,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("パラメーターが整数じゃないよ！っ")).once();
	});

	test.concurrent("Test /dice parameter:-1", async () => {
		const commandMock = mockSlashCommand("dice", {
			parameter: -1,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("パラメーターが0以下の数だよ！っ")).once();
	});

	test.concurrent("Test /choice parameter:ああああ いいいい うううう ええええ おおおお", async () => {
		const choices = ["ああああ", "いいいい", "うううう", "ええええ", "おおおお"];
		let notChoices = choices;
		do {
			const commandMock = mockSlashCommand("choice", {
				items: choices.join(" "),
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(choices).toContain(value);
			if (notChoices.includes(value)) {
				notChoices = notChoices.toSpliced(notChoices.indexOf(value), 1);
			}
		} while (notChoices.length !== 0);
		expect(notChoices).toStrictEqual([]);
	});

	test.concurrent("Test /choice parameter:null", async () => {
		const commandMock = mockSlashCommand("choice");
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);

		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});
});
