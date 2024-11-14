const { InstancesClient } = require("@google-cloud/compute").v1;

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
