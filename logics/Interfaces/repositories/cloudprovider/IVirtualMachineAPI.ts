import type { CloudProviderInstanceDto } from "@/entities/dto/CloudProviderInstanceDto";

export interface IVirtualMachineAPI {
	start(target: CloudProviderInstanceDto): Promise<boolean>;
	state(target: CloudProviderInstanceDto): Promise<boolean>;
	stop(target: CloudProviderInstanceDto): Promise<boolean>;
}
