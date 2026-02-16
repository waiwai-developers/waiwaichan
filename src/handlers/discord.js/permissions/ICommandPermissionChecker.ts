import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";

/**
 * コマンド実行権限チェック結果
 */
export interface CommandPermissionCheckResult {
	isSuccess: boolean;
	errorMessage?: string;
	communityId?: CommunityId;
}

export interface ICommandPermissionChecker {
	checkPermission(
		interaction: ChatInputCommandInteraction<CacheType>,
		commandName: string,
	): Promise<CommandPermissionCheckResult>;
}
