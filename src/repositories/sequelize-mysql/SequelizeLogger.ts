import { MockLogger } from "@/tests/fixtures/repositories/MockLogger";

export const SequelizeLogger = (
	sql: string,
	timing: number | undefined,
	logger: ILogger,
) => {
	// ロガーがundefinedの場合、MockLoggerを使用する
	const safeLogger = logger || new MockLogger();

	// @ts-ignore
	if (typeof timing === "object" && timing?.bind) {
		//@ts-ignore
		const bind = timing.bind;
		safeLogger.info(`${sql} params:{${bind}}`);
	} else {
		safeLogger.info(sql);
	}
};
