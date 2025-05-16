import type { CandyDto } from "@/src/entities/dto/CandyDto";
import type { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyCreatedAt } from "@/src/entities/vo/CandyCreatedAt";
import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { CandyId } from "@/src/entities/vo/CandyId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface ICandyRepository {
	bulkCreateCandy(data: CandyDto[]): Promise<boolean>;
	candyCount(
		communityId: CommunityId,
		userId: UserId,
	): Promise<CandyCount>;
	candyExpire(
		communityId: CommunityId,
		userId: UserId,
	): Promise<CandyExpire | undefined>;
	countByPeriod(
		communityId: CommunityId,
		userId: UserId,
		candyType: CandyCategoryType,
		createdAt: CandyCreatedAt,
	): Promise<CandyCount>;
	findByGiverAndMessageId(
		communityId: CommunityId,
		giver: UserId,
		messageId: DiscordMessageId,
		categoryType: CandyCategoryType,
	): Promise<Array<CandyDto>>;
	consumeCandies(
		communityId: CommunityId,
		userId: UserId,
		candyCount: CandyCount,
	): Promise<CandyId[]>;
	candyCountFromJackpod(
		communityId: CommunityId,
		userId: UserId,
		candyId: CandyId | undefined,
	): Promise<CandyCount>;
}
