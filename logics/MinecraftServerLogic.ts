import { AppConfig } from "@/entities/config/AppConfig";
import { RepoTypes } from "@/entities/constants/DIContainerTypes";
import { CloudProviderInstanceDto } from "@/entities/dto/CloudProviderInstanceDto";
import { CloudProviderInstanceId } from "@/entities/vo/CloudProviderInstanceId";
import { CloudProviderProjectId } from "@/entities/vo/CloudProviderProjectId";
import { CloudProviderZoneId } from "@/entities/vo/CloudProviderZoneId";
import type { IMinecraftServerLogic } from "@/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IVirtualMachineAPI } from "@/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import { inject, injectable } from "inversify";

@injectable()
export class MinecraftServerLogic implements IMinecraftServerLogic {
	private readonly vmInstance: CloudProviderInstanceDto =
		new CloudProviderInstanceDto(
			new CloudProviderProjectId(AppConfig.gcp.project),
			new CloudProviderZoneId(AppConfig.gcp.zone),
			new CloudProviderInstanceId(AppConfig.gcp.instance),
		);

	@inject(RepoTypes.VMInstanceRepository)
	private readonly virtualMachineAPI!: IVirtualMachineAPI;

	async startServer(): Promise<string> {
		const success = await this.virtualMachineAPI.start(this.vmInstance);
		return success
			? "インスタンスを起動したよ！っ"
			: "インスタンスを起動できなかったよ！っ";
	}
	async stopServer(): Promise<string> {
		const success = await this.virtualMachineAPI.stop(this.vmInstance);
		return success
			? "インスタンスを停止したよ！っ"
			: "インスタンスを停止できなかったよ！っ";
	}
}
