import { AppConfig } from "@/src/entities/config/AppConfig";
import { DiscordServer } from "@/src/routes/discordjs/DiscordServer";
await new DiscordServer().start(AppConfig.discord.token);
