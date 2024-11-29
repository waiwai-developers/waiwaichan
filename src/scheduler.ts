import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});

cron.schedule("* * * * *", () => ReminderNotifyHandler(client));
await client.login(AppConfig.discord.token);
