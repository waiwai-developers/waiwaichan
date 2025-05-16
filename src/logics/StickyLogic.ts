import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IStickyRepository } from "@/src/logics/Interfaces/repositories/database/IStickyRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class StickyLogic implements IStickyLogic {
	@inject(RepoTypes.StickyRepository)
	private readonly StickyRepository!: IStickyRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: StickyDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
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
	): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.StickyRepository.delete(guildId, channelId);
			return "スティッキーを削除したよ！っ";
		});
	}
	async update(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.StickyRepository.updateForMessageId(
				guildId,
				channelId,
				messageId,
			);
			return "スティッキーを更新したよ！っ";
		});
	}
}
