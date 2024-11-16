import { InstancesClient } from "@google-cloud/compute";

export const instanceStart = async (project, zone, instance) => {
	try {
		const computeClient = new InstancesClient();

		const request = {
			project,
			zone,
			instance,
		};

		const response = await computeClient.start(request);
		return response;
	} catch (e) {
		console.error("Error:", e);
	}
};
