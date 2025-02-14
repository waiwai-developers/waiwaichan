import "reflect-metadata";
import process from "node:process";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { DiscordCommandRegister } from "@/src/routes/discordjs/DiscordCommandRegister";
import { DiscordServer } from "@/src/routes/discordjs/DiscordServer";
import { registerShutdownHook } from "@/src/shutdownHook";

// initialize DB
new MysqlConnector();
// start Discord Server
const server = new DiscordServer();
// clean up guild command if dev server
if (process.env.NODE_ENV !== "production") {
	registerShutdownHook(async () => {
		console.log("shutting down......");
		await Promise.all([
			new DiscordCommandRegister().cleanUp(AppConfig.discord.token),
			server.client.destroy(),
		]);
		console.log("cleanup");
	});
}

await server.start(AppConfig.discord.token);
