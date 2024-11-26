import { appContainer } from "@/src/app.di.config";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IVirtualMachineAPI } from "@/src/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/src/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import {
	mockSlashCommand,
	waitUntilReply,
} from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import {
	MockFailVirtualMachineAPI,
	MockVirtualMachineAPI,
} from "@/tests/fixtures/repositories/MockVirtualMachineAPI";
import { anyString, instance, mock, verify, when } from "ts-mockito";

describe("Test Minecraft Commands", () => {
	beforeEach(() => {
		appContainer
			.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository)
			.toConstantValue(MockVirtualMachineAPI());
	});
	test("Test /minecraftstart", async () => {
		const commandMock = mockSlashCommand("minecraftstart");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply("インスタンスを起動したよ！っ")).once();
	});

	test("Test /minecraftstop", async () => {
		const commandMock = mockSlashCommand("minecraftstop");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply("インスタンスを停止したよ！っ")).once();
	});

	test("Test /minecraftstart fail", async () => {
		appContainer
			.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository)
			.toConstantValue(MockFailVirtualMachineAPI());
		const commandMock = mockSlashCommand("minecraftstart");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(
			commandMock.editReply("インスタンスを起動できなかったよ！っ"),
		).once();
	});

	test("Test /minecraftstop fail", async () => {
		appContainer
			.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository)
			.toConstantValue(MockFailVirtualMachineAPI());
		const commandMock = mockSlashCommand("minecraftstop");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(
			commandMock.editReply("インスタンスを停止できなかったよ！っ"),
		).once();
	});
	afterAll(() => {
		appContainer
			.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository)
			.to(GCPComputeEngineInstanceRepositoryImpl);
	});
});
