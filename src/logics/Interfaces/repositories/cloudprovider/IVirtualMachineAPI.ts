import type { CloudProviderInstanceDto } from "@/src/entities/dto/CloudProviderInstanceDto";

export interface IVirtualMachineAPI {
	start(target: CloudProviderInstanceDto): Promise<boolean>;
	state(target: CloudProviderInstanceDto): Promise<boolean>;
	stop(target: CloudProviderInstanceDto): Promise<boolean>;
}
