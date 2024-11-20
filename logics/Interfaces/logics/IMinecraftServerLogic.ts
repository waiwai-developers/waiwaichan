export interface IMinecraftServerLogic {
	startServer(): Promise<string>;
	stopServer(): Promise<string>;
}
