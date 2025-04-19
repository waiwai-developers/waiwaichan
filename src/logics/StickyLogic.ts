import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IStickyRepository } from "@/src/logics/Interfaces/repositories/database/IStickyRepository";
import { inject, injectable } from "inversify";

import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

@injectable()
export class StickyLogic implements IStickyLogic {
	@inject(RepoTypes.StickyRepository)
	private readonly StickyRepository!: IStickyRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: StickyDto): Promise<string> {
		if (
			AccountsConfig.users.map((u) => u.role).includes(data.userId.getValue())
		) {
			return "スティッキーを登録する権限を持っていないよ！っ";
		}
		return this.transaction.startTransaction(async () => {
			if (await this.StickyRepository.findOne(data.guildId, data.channelId)) {
				return "スティッキーが既にチャンネルに登録されているよ！っ";
			}
			await this.StickyRepository.create(data);
			return "スティッキーを登録したよ！っ";
		});
	}

	async find(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.StickyRepository.findOne(guildId, channelId);
		});
	}

	async delete(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		userId: DiscordUserId,
	): Promise<string> {
		if (AccountsConfig.users.map((u) => u.role).includes(userId.getValue())) {
			return "スティッキーを削除する権限を持っていないよ！っ";
		}
		return this.transaction.startTransaction(async () => {
			const success = await this.StickyRepository.delete(guildId, channelId);
			if (!success) return "スティッキーが登録されていなかったよ！っ";
			return "スティッキーを削除したよ！っ";
		});
	}
}
