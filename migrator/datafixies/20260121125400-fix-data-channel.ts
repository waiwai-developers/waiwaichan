import type { Datafix } from "@/migrator/umzug";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { ChannelBatchStatus } from "@/src/entities/vo/ChannelBatchStatus";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import {
	Client,
	ChannelType as DiscordChannelType,
	GatewayIntentBits,
} from "discord.js";
import { DatafixChannelModel } from "./models/DatafixChannelModel";
import { DatafixCommunityModel } from "./models/DatafixCommunityModel";

/**
 * DiscordのChannelTypeをアプリケーションのChannelTypeに変換する
 * @param discordChannelType discord.jsのChannelType
 * @returns アプリケーションのChannelType（0: その他、1: テキストチャンネル、2: ボイスチャンネル）
 */
const getChannelType = (
	discordChannelType: DiscordChannelType,
): ChannelType => {
	// テキストチャンネル（GuildText = 0）
	if (discordChannelType === DiscordChannelType.GuildText) {
		return ChannelType.Text;
	}
	// ボイスチャンネル（GuildVoice = 2）
	if (discordChannelType === DiscordChannelType.GuildVoice) {
		return ChannelType.Voice;
	}
	// その他のチャンネルタイプ
	return ChannelType.Other;
};

export const up: Datafix = async () => {
	if (process.env.NODE_ENV === "testing") {
		console.log("skip discord Channel datafix in CI/testing environment");
		return;
	}

	const client = new Client({
		intents: [GatewayIntentBits.Guilds],
	});

	try {
		// clientがreadyになるまで待機する
		await new Promise<void>((resolve, reject) => {
			client.once("ready", () => {
				console.log("Discord client is ready");
				resolve();
			});
			client.once("error", (error) => {
				console.error("Discord client error:", error);
				reject(error);
			});
			client.login(AppConfig.discord.token).catch((error) => {
				console.error("Discord login failed:", error);
				reject(error);
			});
		});

		const communities = await DatafixCommunityModel.findAll();
		console.log(`found ${communities.length} communities`);

		for (const community of communities) {
			try {
				console.log(`processing community guild: ${community.clientId}`);
				const guild = await client.guilds.fetch(community.clientId);
				const channels = await guild.channels.fetch();
				console.log(
					`fetched ${channels.size} channels for guild: ${community.clientId}`,
				);
				const channelData = channels
					.filter((channel) => channel !== null)
					.map((channel) => {
						const channelType = getChannelType(channel.type);
						return {
							categoryType: ChannelCategoryType.Discord.getValue(),
							clientId: BigInt(channel.id),
							channelType: channelType.getValue(),
							communityId: community.id,
							batchStatus: ChannelBatchStatus.Yet.getValue(),
						};
					});
				if (channelData.length > 0) {
					await DatafixChannelModel.bulkCreate(channelData);
					console.log(
						`successfully created ${channelData.length} Channels for community guildId: ${community.clientId}`,
					);
				} else {
					console.log(
						`no channels to create for community guildId: ${community.clientId}`,
					);
				}
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(
					`error processing community guildId: ${community.clientId}: ${message}`,
				);
			}
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`migration failed: ${message}`);
		throw error;
	} finally {
		// Discordクライアントを適切に終了する
		console.log("destroying Discord client");
		client.destroy();
	}
};

export const down: Datafix = async () => {
	await DatafixChannelModel.destroy({
		where: {},
		truncate: true,
	});
};
