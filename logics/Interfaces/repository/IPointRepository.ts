import type { PointDto } from "../../../entities/dto/PointDto";
import type { DiscordUserId } from "../../../entities/vo/DiscordUserId";
import type { PointCount } from "../../../entities/vo/PointCount";

export interface IPointRepository {
	createPoint(data: PointDto): Promise<boolean>;
	pointCount(userId: DiscordUserId): Promise<PointCount>;
	ConsumePoints(userId: DiscordUserId, points: PointCount): Promise<boolean>;
}
