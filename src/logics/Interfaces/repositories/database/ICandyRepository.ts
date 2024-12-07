import type { CandyDto } from "@/src/entities/dto/CandyDto";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export interface ICandyRepository {
	createCandy(data: CandyDto): Promise<boolean>;
	candyCount(userId: DiscordUserId): Promise<CandyCount>;
	countByToday(userId: DiscordUserId): Promise<CandyCount>;
	findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<CandyDto>>;
	ConsumeCandies(userId: DiscordUserId, Candies?: CandyCount): Promise<boolean>;
}
