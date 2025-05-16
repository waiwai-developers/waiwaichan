interface ILogger {
	trace(msg: string): void;
	debug(msg: string): void;
	info(msg: string): void;
	error(msg: string): void;
	fatal(msg: string): void;
}

export const SequelizeLogger = (
	sql: string,
	timing: number | undefined,
	logger?: ILogger,
) => {
	if (!logger) {
		console.log(sql);
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
