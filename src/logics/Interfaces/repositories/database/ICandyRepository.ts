import type { CandyDto } from "@/src/entities/dto/CandyDto";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export interface ICandyRepository {
	createCandy(data: CandyDto): Promise<boolean>;
	candyCount(userId: DiscordUserId): Promise<CandyCount>;
	candyExpire(userId: DiscordUserId): Promise<CandyExpire | undefined>;
	countByToday(userId: DiscordUserId): Promise<CandyCount>;
	findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<CandyDto>>;
	ConsumeCandies(userId: DiscordUserId, candies?: CandyCount): Promise<boolean>;
	ConsumeSeriesCandies(
		userId: DiscordUserId,
		candies?: CandyCount,
	): Promise<boolean>;
}
