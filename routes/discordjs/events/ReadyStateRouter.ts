import type { DiscordEventRouter } from "@/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";

export class ReadyStateRouter implements DiscordEventRouter {
	register(client: Client): void {
		client.on("ready", async (c: Client) => {
			if (c.isReady()) {
				console.log(`login: ${c.user.tag}`);
			}
		});
	}
}
