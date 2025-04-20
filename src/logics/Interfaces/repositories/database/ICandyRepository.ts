import type { CandyDto } from "@/src/entities/dto/CandyDto";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export interface ICandyRepository {
	createCandy(data: CandyDto): Promise<boolean>;
	candyCount(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyCount>;
	candyExpire(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyExpire | undefined>;
	countByToday(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyCount>;
	findByGiverAndMessageId(
		guildId: DiscordGuildId,
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<CandyDto>>;
	ConsumeCandies(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		Candies?: CandyCount,
	): Promise<boolean>;
}
