import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { TranslateConst } from "@/src/entities/constants/translate";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { anything, instance, verify, when } from "ts-mockito";

const JAPANESE_SOURCE = TranslateConst.source.find((it) => it.value === "JA")?.value;
const JAPANESE_TARGET = TranslateConst.target.find((it) => it.value === "JA")?.value;
const ENGLISH_SOURCE = TranslateConst.source.find((it) => it.value === "EN")?.value;
const ENGLISH_TARGET = TranslateConst.target.find((it) => it.value === "EN-US")?.value;

describe("Test Translate Command", () => {
	test("Test /translate source:EN target:JA messages:Hello World! ", async () => {
		const commandMock = mockSlashCommand("translate", {
			source: ENGLISH_SOURCE,
			target: JAPANESE_TARGET,
			messages: "Hello World!",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let result = "";
		when(commandMock.editReply(anything())).thenCall((arg) => {
			result = arg;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).once();
		verify(commandMock.editReply("")).never();
	});

	test("Test /translate source:null target:JA messages:Hello World! ", async () => {
		const commandMock = mockSlashCommand("translate", {
			source: null,
			target: JAPANESE_TARGET,
			messages: "Hello World!",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let result = "";
		when(commandMock.editReply(anything())).thenCall((arg) => {
			result = arg;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /translate source:EN target:null messages:Hello World! ", async () => {
		const commandMock = mockSlashCommand("translate", {
			source: ENGLISH_SOURCE,
			target: null,
			messages: "Hello World!",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let result = "";
		when(commandMock.editReply(anything())).thenCall((arg) => {
			result = arg;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /translate source:EN target:JA messages:null", async () => {
		const commandMock = mockSlashCommand("translate", {
			source: ENGLISH_SOURCE,
			target: JAPANESE_TARGET,
			messages: null,
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let result = "";
		when(commandMock.editReply(anything())).thenCall((arg) => {
			result = arg;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /translate source:JA target:JA messages:Hello World!", async () => {
		const commandMock = mockSlashCommand("translate", {
			source: JAPANESE_SOURCE,
			target: JAPANESE_TARGET,
			messages: "Hello World!",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();
		let result = "";
		when(commandMock.editReply(anything())).thenCall((arg) => {
			result = arg;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).never();
		verify(commandMock.editReply(anything())).once();
		verify(commandMock.editReply("sourceとtargetが同じだよ！っ")).once();
	});
});
