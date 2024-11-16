import config from "../config.json" with { type: "json" };
import { instanceStop } from "../repositories/gcpapi/instanceStop.js";

export const minecraftStop = async () => {
	try {
		const instance = await instanceStop(
			config.gcp.project,
			config.gcp.zone,
			config.gcp.instance,
		);
		if (instance.error) return "インスタンスを停止できなかったよ！っ";

		return "インスタンスを停止したよ！っ";
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
