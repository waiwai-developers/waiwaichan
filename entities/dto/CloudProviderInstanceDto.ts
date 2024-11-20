import type { CloudProviderInstanceId } from "@/entities/vo/CloudProviderInstanceId";
import type { CloudProviderProjectId } from "@/entities/vo/CloudProviderProjectId";
import type { CloudProviderZoneId } from "@/entities/vo/CloudProviderZoneId";

export class CloudProviderInstanceDto {
	constructor(
		public projectId: CloudProviderProjectId,
		public zoneId: CloudProviderZoneId,
		public instanceId: CloudProviderInstanceId,
	) {}
}
