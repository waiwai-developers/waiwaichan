import { appContainer } from "@/src/app.di.config";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IVirtualMachineAPI } from "@/src/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/src/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { MockFailVirtualMachineAPI, MockVirtualMachineAPI } from "@/tests/fixtures/repositories/MockVirtualMachineAPI";
import { instance, verify } from "ts-mockito";

describe("Test Minecraft Commands", () => {
	beforeEach(() => {
		appContainer.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository).toConstantValue(MockVirtualMachineAPI());
	});
	it("Test /minecraftstart", async () => {
		const commandMock = mockSlashCommand("minecraftstart");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply("インスタンスを起動したよ！っ")).once();
	});

	it("Test /minecraftstop", async () => {
		const commandMock = mockSlashCommand("minecraftstop");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply("インスタンスを停止したよ！っ")).once();
	});

	it("Test /minecraftstart fail", async () => {
		appContainer.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository).toConstantValue(MockFailVirtualMachineAPI());
		const commandMock = mockSlashCommand("minecraftstart");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply("インスタンスを起動できなかったよ！っ")).once();
	});

	it("Test /minecraftstop fail", async () => {
		appContainer.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository).toConstantValue(MockFailVirtualMachineAPI());
		const commandMock = mockSlashCommand("minecraftstop");
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply("インスタンスを停止できなかったよ！っ")).once();
	});
	after(() => {
		appContainer.rebind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository).to(GCPComputeEngineInstanceRepositoryImpl);
	});
});
