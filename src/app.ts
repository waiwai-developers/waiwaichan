import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { DiscordServer } from "@/src/routes/discordjs/DiscordServer";

// initialize DB
new MysqlConnector();
// start Discord Server
await new DiscordServer().start(AppConfig.discord.token);
