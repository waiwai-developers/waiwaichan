import type { Client } from "discord.js";

export interface DiscordEventRouter {
	register(client: Client): void;
}
