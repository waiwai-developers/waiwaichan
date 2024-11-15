import config from "../config.json" with { type: "json" };
import { instanceStart } from "../repositorys/gcpapi/instanceStart.js";

export const minecraftStart = async () => {
	try {
		const instance = await instanceStart(
			config.gcp.project,
			config.gcp.zone,
			config.gcp.instance,
		);
		if (instance.error) return "インスタンスを起動できなかったよ！っ";

		return "インスタンスを起動したよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
