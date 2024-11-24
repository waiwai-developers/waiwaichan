export interface DiscordEventHandler<T> {
	handle(arg: T): Promise<void>;
}
