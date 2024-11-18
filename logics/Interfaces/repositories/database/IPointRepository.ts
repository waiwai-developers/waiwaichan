import type { PointDto } from "@/entities/dto/PointDto";
import type { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { PointCount } from "@/entities/vo/PointCount";

export interface IPointRepository {
	createPoint(data: PointDto): Promise<boolean>;
	pointCount(userId: DiscordUserId): Promise<PointCount>;
	countByToday(userId: DiscordUserId): Promise<PointCount>;
	findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<PointDto>>;
	ConsumePoints(userId: DiscordUserId, points: PointCount): Promise<boolean>;
}
