import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { IRoomChannelLogic } from "@/src/logics/Interfaces/logics/IRoomChannelLogic";
import type { IRoomChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoomChannelLogic
	implements IRoomChannelLogic
{
	@inject(RepoTypes.RoomChannelRepository)
	private readonly RoomChannelRepository!: IRoomChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: RoomChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomChannelRepository.create(data);
			return "部屋追加チャンネルを登録したよ！っ";
		});
	}

	async delete(data: RoomChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomChannelRepository.delete(data);
			return "部屋追加チャンネルを削除したよ！っ";
		});
	}
}
