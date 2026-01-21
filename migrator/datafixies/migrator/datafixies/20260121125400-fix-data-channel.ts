import type { Datafix } from "@/migrator/umzug";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { ChannelBatchStatus } from "@/src/entities/vo/ChannelBatchStatus";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { Client, GatewayIntentBits, ChannelType as DiscordChannelType } from "discord.js";
import { DatafixCommunityModel } from "../../models/DatafixCommunityModel";
import { DatafixChannelModel } from "../../models/DatafixChannelModel";

/**
 * DiscordのChannelTypeをアプリケーションのChannelTypeに変換する
 * @param discordChannelType discord.jsのChannelType
 * @returns アプリケーションのChannelType（0: その他、1: テキストチャンネル、2: ボイスチャンネル）
 */
const getChannelType = (discordChannelType: DiscordChannelType): ChannelType => {
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
    await client.login(AppConfig.discord.token);

    try {
        const communities = await DatafixCommunityModel.findAll();
        for (const community of communities) {
            try {
                console.log(`processing community guild: ${community.clientId}`);
                const guild = await client.guilds.fetch(community.clientId);
                const channels = await guild.channels.fetch();
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
                }
                console.log(
                    `successfully created ${channelData.length} Channels for community guildId: ${community.clientId}`,
                );
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
    }
};

export const down: Datafix = async () => {
    await DatafixChannelModel.destroy({
        where: {},
        truncate: true,
    });
};
