import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";

export const SequelizeLogger = (
	sql: string,
	timing: number | undefined,
	logger?: ILogger,
) => {
	if (!logger) {
		console.error(sql);
		return;
	}

	// @ts-ignore
	if (typeof timing === "object" && timing?.bind) {
		//@ts-ignore
		const bind = timing.bind;
		logger.info(`${sql} params:{${bind}}`);
	} else {
		logger.info(sql);
	}
};
