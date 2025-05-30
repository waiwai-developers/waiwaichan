import { pino } from "pino";

const Logger = pino({
	transport: {
		targets: [
			{
				level: "info",
				target: "pino-pretty",
				options: {},
			},
		],
	},
});

export class PinoSchedulerLogger implements ILogger {
	debug(msg: string): void {
		Logger.debug(msg);
	}

	error(msg: string): void {
		Logger.error(msg);
	}

	fatal(msg: string): void {
		Logger.fatal(msg);
	}

	info(msg: string): void {
		Logger.info(msg);
	}

	trace(msg: string): void {
		Logger.trace(msg);
	}
}
