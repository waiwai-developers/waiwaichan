import "./di.config";
import { AppConfig } from "@/entities/config/AppConfig";
import { DiscordServer } from "@/routes/discordjs/DiscordServer";
await new DiscordServer().start(AppConfig.discord.token);
