import { CrownDto } from "@/src/entities/dto/CrownDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
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
	declare communityId: number;
	@PrimaryKey
	@Column(DataType.STRING)
	declare messageId: string;

	async findOne(data: CrownDto): Promise<CrownDto | undefined> {
		return await CrownRepositoryImpl.findOne({
			where: {
				communityId: data.communityId.getValue(),
				messageId: data.messageId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async create(data: CrownDto): Promise<boolean> {
		return await CrownRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			messageId: data.messageId.getValue(),
		}).then((res) => !!res);
	}

	toDto(): CrownDto {
		return new CrownDto(
			new CommunityId(this.communityId),
			new DiscordMessageId(this.messageId),
		);
	}
}
export { CrownRepositoryImpl };
