import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { inject, injectable } from "inversify";
import type { Model, ModelStatic } from "sequelize";
import { MysqlSchedulerConnector } from "./MysqlSchedulerConnector";

@injectable()
class DataDeletionCircularImpl implements IDataDeletionCircular {
	@inject(RepoTypes.CommunityRepository)
	private readonly CommunityRepository!: ICommunityRepository;

	@inject(RepoTypes.UserRepository)
	private readonly UserRepository!: IUserRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async deleteRecordInRelatedTableCommunityId(
		communityId: CommunityId,
	): Promise<boolean> {
		return this.deleteRecordInRelatedTable(
			"communityId",
			communityId.getValue(),
		).then((res) => {
			res ? this.CommunityRepository.updatebatchStatus : false;
		});
	}

	async deleteRecordInRelatedTableUserId(userId: UserId): Promise<boolean> {
		return this.deleteRecordInRelatedTable("userId", userId.getValue()).then(
			(res) => {
				res ? this.CommunityRepository.updatebatchStatus : false;
			},
		);
	}

	private async deleteRecordInRelatedTable(
		columnName: string,
		id: number,
	): Promise<boolean> {
		const mysqlConnectorModels = MysqlConnector.models as Array<
			ModelStatic<Model>
		>;
		const mysqlSchedulerConnectorModels =
			MysqlSchedulerConnector.models as Array<ModelStatic<Model>>;
		const models = [...mysqlConnectorModels, ...mysqlSchedulerConnectorModels];
		const relatedModels = models.filter((m) =>
			Object.keys(m.getAttributes()).includes(columnName),
		);
		// コミュニティまたはユーザーのBatchStatusをupdateするロジックを入れる
		return await Promise.all(
			relatedModels.map((m) =>
				m.destroy({
					where: {
						[columnName]: id,
					},
				}),
			),
		).then(
			(res) =>
				!!res.map((r) => r >= 0).reduce((acc, curr) => acc && curr, true),
		);
	}
}
export { DataDeletionCircularImpl };
