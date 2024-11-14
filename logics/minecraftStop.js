import config from "../config.json" with { type: "json" };
import { minecraftStop } from "../repositorys/gcpapi/instanceStop.js";

export const minecraftStop = () => {
	try {
	    const instance = await computeClient(config.project, config.zone, config.instance)
		if (instance.error) return "インスタンスを停止できなかったよ！っ" ;

        return "インスタンスを停止したよ！っ" ;
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
