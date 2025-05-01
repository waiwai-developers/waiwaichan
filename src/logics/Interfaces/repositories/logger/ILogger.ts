export interface ILogger {
	trace(msg: string): void;
	debug(msg: string): void;
	info(msg: string): void;
	error(msg: string): void;
	fatal(msg: string): void;
}
