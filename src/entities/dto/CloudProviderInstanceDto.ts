import type { CloudProviderInstanceId } from "@/src/entities/vo/CloudProviderInstanceId";
import type { CloudProviderProjectId } from "@/src/entities/vo/CloudProviderProjectId";
import type { CloudProviderZoneId } from "@/src/entities/vo/CloudProviderZoneId";

export class CloudProviderInstanceDto {
	constructor(
		public projectId: CloudProviderProjectId,
		public zoneId: CloudProviderZoneId,
		public instanceId: CloudProviderInstanceId,
	) {}
}
