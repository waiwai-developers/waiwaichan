import type { PointDto } from "@/src/entities/dto/PointDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { PointCount } from "@/src/entities/vo/PointCount";

export interface IPointRepository {
	createPoint(data: PointDto): Promise<boolean>;
	pointCount(userId: DiscordUserId): Promise<PointCount>;
	countByToday(userId: DiscordUserId): Promise<PointCount>;
	findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<PointDto>>;
	ConsumePoints(userId: DiscordUserId, points?: PointCount): Promise<boolean>;
}
