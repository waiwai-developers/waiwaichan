import type { ActionDto } from "@/src/entities/dto/ActionDto";
// import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
// import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
// import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";

export interface ICommunityLogic {
	create(data: ActionDto): Promise<boolean>;
	delete(data: ActionDto): Promise<boolean>;
}
