import type { CandyDto } from "@/src/entities/dto/CandyDto";
import type { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyCreatedAt } from "@/src/entities/vo/CandyCreatedAt";
import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { CandyId } from "@/src/entities/vo/CandyId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export interface ICandyRepository {
	bulkCreateCandy(data: CandyDto[]): Promise<boolean>;
	candyCount(userId: DiscordUserId): Promise<CandyCount>;
	candyExpire(userId: DiscordUserId): Promise<CandyExpire | undefined>;
	countByPeriod(
		userId: DiscordUserId,
		candyType: CandyCategoryType,
		createdAt: CandyCreatedAt,
	): Promise<CandyCount>;
	findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
		categoryType: CandyCategoryType,
	): Promise<Array<CandyDto>>;
	consumeCandies(
		userId: DiscordUserId,
		candyCount: CandyCount,
	): Promise<CandyId[]>;
	candyCountFromJackpod(
		userId: DiscordUserId,
		candyId: CandyId | undefined,
	): Promise<CandyCount>;
}
