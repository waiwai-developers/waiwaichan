import { CrownDto } from "@/src/entities/dto/CrownDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { ICrownRepository } from "@/src/logics/Interfaces/repositories/database/ICrownRepository";
import { injectable } from "inversify";
import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Crowns",
	timestamps: true,
})
class CrownRepositoryImpl extends Model implements ICrownRepository {
	@PrimaryKey
	@Column(DataType.STRING)
	declare guildId: string;
	@PrimaryKey
	@Column(DataType.STRING)
	declare messageId: string;

	async findOne(data: CrownDto): Promise<CrownDto | undefined> {
		return await CrownRepositoryImpl.findOne({
			where: {
				guildId: data.guildId.getValue(),
				messageId: data.messageId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async create(data: CrownDto): Promise<boolean> {
		return await CrownRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			messageId: data.messageId.getValue(),
		}).then((res) => !!res);
	}

	toDto(): CrownDto {
		return new CrownDto(
			new DiscordGuildId(this.guildId),
			new DiscordMessageId(this.messageId),
		);
	}
}
export { CrownRepositoryImpl };
