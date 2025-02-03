import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { ShiritoriWordDto } from "@/src/entities/dto/ShiritoriWordDto";
import { ShiritoriWordGuildId } from "@/src/entities/vo/ShiritoriWordGuildId";
import type { ShiritoriWordThreadId } from "@/src/entities/vo/ShiritoriWordThreadId";
import { ShiritoriWordMessageId } from "@/src/entities/vo/ShiritoriWordMessageId";
import type { ShiritoriWordReadingWord } from "@/src/entities/vo/ShiritoriWordReadingWord";
import type { ShiritoriWordWritingWord } from "@/src/entities/vo/ShiritoriWordWritingWord";
import { ShiritoriWordNextMessageId } from "@/src/entities/vo/ShiritoriWordNextMessageId"

import type { IShiritoriLogic } from "@/src/logics/Interfaces/logics/IShiritoriLogic.ts";
import type { IShiritoriWordRepository } from "@/src/logics/Interfaces/repositories/database/IShiritoriWorkRepository";
import { inject, injectable } from "inversify";

@injectable()
export class ShiritoriLogic implements IShiritoriLogic {
	@inject(RepoTypes.ShiritoriWordRepository)
	private readonly ShiritoriWordRepository!: IShiritoriWordRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction<TransactionLike>;

	async createWord(data: ShiritoriWordDto): Promise<string> {
		const { userId, guildId, threadId, messageId, readingWord, writingWord } =
			data;

		if (userId.getValue() === null) return "userIdパラメーターがないよ！っ";
		if (guildId.getValue() === null) return "guildIdパラメーターがないよ！っ";
		if (threadId.getValue() === null) return "threadIdパラメーターがないよ！っ";
		if (messageId.getValue() === null) return "messageIdパラメーターがないよ！っ";
		if (readingWord.getValue() === "") return "readingWordパラメーターがないよ！っ";
		if (writingWord.getValue() === "") return "writingWordパラメーターがないよ！っ";

		return this.transaction.startTransaction(async (t) => {

			const latestWord = await this.ShiritoriWordRepository.findThreadLatestWord(
				guildId,
				threadId,
			)

			if (latestWord === undefined) {
				await t.rollback();
				return "1つ前の投稿が見つからないよ！っ"
			}

			const nextWord = await this.ShiritoriWordRepository.createWord(data)

			if (nextWord === undefined) {
				await t.rollback();
				return "投稿を登録できなかったよ！っ"
			}

			const isUpdated = await this.ShiritoriWordRepository.updateBackWord(
				latestWord.guildId,
				latestWord.messageId,
				new ShiritoriWordNextMessageId(nextWord.messageId.getValue())
			)

			if (!isUpdated) {
				await t.rollback();
				return "1つ前の投稿を更新できなかったよ！っ"
			}

			t.commit();
			return "投稿を登録できたよ！っ";
		});
	}

	async updateWord(
		guildId: ShiritoriWordGuildId,
		threadId: ShiritoriWordThreadId,
		messageId: ShiritoriWordMessageId,
		readingWord: ShiritoriWordReadingWord,
		writingWord: ShiritoriWordWritingWord,
	): Promise<string> {
		if (guildId.getValue() === null) return "guildIdパラメーターがないよ！っ";
		if (messageId.getValue() === null) return "messageIdパラメーターがないよ！っ";
		if (readingWord.getValue() === "") return "readingWordパラメーターがないよ！っ";
		if (writingWord.getValue() === "") return "writingWordパラメーターがないよ！っ";

		return this.transaction.startTransaction(async (t) => {

			const latestWord = await this.ShiritoriWordRepository.findThreadLatestWord(
				guildId,
				threadId,
			)

			if (latestWord === undefined) {
				await t.rollback();
				return "最新の投稿が見つからないよ！っ"
			}

			if (latestWord.messageId !== messageId) {
				await t.rollback();
				return "最新の投稿以外を編集しようとしているよ！っ"
			}

			const isUpdate = await this.ShiritoriWordRepository.updateWord(
				guildId,
				messageId,
				readingWord,
				writingWord,
			);

			if (!isUpdate) {
				await t.rollback();
				return "投稿を更新できなかったよ！っ"
			}

			t.commit();
			return "投稿を更新できたよ！っ";
		});
	}

	async deleteWord(
		guildId: ShiritoriWordGuildId,
		threadId: ShiritoriWordThreadId,
		messageId: ShiritoriWordMessageId,
	): Promise<string> {
		if (guildId.getValue() === null) return "guildIdパラメーターがないよ！っ";
		if (messageId.getValue() === null) return "messageIdパラメーターがないよ！っ";

		return this.transaction.startTransaction(async (t) => {

			const latestWord = await this.ShiritoriWordRepository.findThreadLatestWord(
				guildId,
				threadId,
			)

			if (latestWord === undefined) {
				await t.rollback();
				return "最新の投稿が見つからないよ！っ"
			}

			if (latestWord.messageId !== messageId) {
				await t.rollback();
				return "最新の投稿以外を削除しようとしているよ！っ"
			}

			const isDeleted = await this.ShiritoriWordRepository.deleteWord(
				guildId,
				messageId,
			);

			if (!isDeleted) {
				await t.rollback();
				return "投稿を削除できなかったよ！っ"
			}

			const secondLatestWord = await this.ShiritoriWordRepository.findThreadLatestWord(
				guildId,
				threadId,
			)

			if (secondLatestWord === undefined) {
				await t.rollback();
				return "1つ前の投稿が見つからないよ！っ"
			}

			const isUpdated = await this.ShiritoriWordRepository.updateBackWord(
				secondLatestWord.guildId,
				secondLatestWord.messageId,
				new ShiritoriWordNextMessageId(null)
			)

			if (!isUpdated) {
				await t.rollback();
				return "前の投稿が見つからないよ！っ"
			}

			t.commit();
			return "投稿を削除できたよ！っ";
		});
	}
}
