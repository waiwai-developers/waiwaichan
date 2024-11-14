import config from "../config.json" with { type: "json" };
import { minecraftStart } from "../repositorys/gcpapi/instanceStart.js";

export const minecraftStart = () => {
	try {
	    const instance = await computeClient(config.project, config.zone, config.instance)
		if (instance.error) return "インスタンスを起動できなかったよ！っ" ;

        return "インスタンスを起動したよ！っ"
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
