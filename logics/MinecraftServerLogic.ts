import type { IMinecraftServerLogic } from "@/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IVirtualMachineAPI } from "@/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";

export class MinecraftServerLogic implements IMinecraftServerLogic {
	constructor(private readonly virtualMachineAPI: IVirtualMachineAPI) {}

	startServer(): Promise<string> {
		throw new Error("Method not implemented.");
	}
	stopServer(): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
