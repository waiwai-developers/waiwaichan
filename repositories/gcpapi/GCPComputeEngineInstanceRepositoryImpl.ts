import type { CloudProviderInstanceDto } from "@/entities/dto/CloudProviderInstanceDto";
import type { IVirtualMachineAPI } from "@/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import { InstancesClient } from "@google-cloud/compute";
import type * as protos from "@google-cloud/compute/build/protos/protos";
import { injectable } from "inversify";

@injectable()
export class GCPComputeEngineInstanceRepositoryImpl
	implements IVirtualMachineAPI
{
	computeClient: InstancesClient;
	constructor() {
		this.computeClient = new InstancesClient();
	}
	async start(target: CloudProviderInstanceDto): Promise<boolean> {
		const request: protos.google.cloud.compute.v1.IStartInstanceRequest = {
			project: target.projectId.getValue(),
			zone: target.zoneId.getValue(),
			instance: target.instanceId.getValue(),
		};
		return this.computeClient
			.start(request)
			.then((_) => true)
			.catch((e) => {
				console.error(e);
				return false;
			});
	}

	state(_target: CloudProviderInstanceDto): Promise<boolean> {
		throw new Error("not implemented");
	}

	async stop(target: CloudProviderInstanceDto): Promise<boolean> {
		const request: protos.google.cloud.compute.v1.IStopInstanceRequest = {
			project: target.projectId.getValue(),
			zone: target.zoneId.getValue(),
			instance: target.instanceId.getValue(),
		};
		return this.computeClient
			.stop(request)
			.then((_) => true)
			.catch((e) => {
				console.error(e);
				return false;
			});
	}
}
