import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { IRoomNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomNotificationChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoomNotificationChannelLogic
	implements IRoomNotificationChannelLogic
{
	@inject(RepoTypes.RoomNotificationChannelRepository)
	private readonly RoomNotificationChannelRepository!: IRoomNotificationChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: RoomNotificationChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomNotificationChannelRepository.create(data);
			return "部屋追加チャンネルを登録したよ！っ";
		});
	}

	async find(
		discordGuildId: DiscordGuildId,
	): Promise<RoomNotificationChannelDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomNotificationChannelRepository.findOne(
				discordGuildId,
			);
		});
	}

	async delete(discordGuildId: DiscordGuildId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomNotificationChannelRepository.delete(discordGuildId);
			return "部屋追加チャンネルを削除したよ！っ";
		});
	}
}
