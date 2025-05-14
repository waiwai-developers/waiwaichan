import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
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
		id: CommunityId,
	): Promise<boolean> {
		return this.deleteRecordInRelatedTable("communityId", id.getValue()).then(
			(res) => {
				return res ? this.CommunityRepository.updatebatchStatus(id) : false;
			},
		);
	}

	async deleteRecordInRelatedTableUserId(id: UserId): Promise<boolean> {
		return this.deleteRecordInRelatedTable("userId", id.getValue()).then(
			(res) => {
				return res ? this.UserRepository.updatebatchStatus(id) : false;
			},
		);
	}

	private async deleteRecordInRelatedTable(
		columnName: string,
		id: number,
	): Promise<boolean> {
		try {
			// スケジューラーコネクタのモデルのみを使用
			const mysqlSchedulerConnectorModels =
				MysqlSchedulerConnector.models as Array<ModelStatic<Model>>;

			// 関連するモデルをフィルタリング
			const relatedModels = mysqlSchedulerConnectorModels.filter((m) => {
				try {
					return Object.keys(m.getAttributes()).includes(columnName);
				} catch (error) {
					// モデルが初期化されていない場合はスキップ
					return false;
				}
			});

			// 関連するモデルがない場合は成功として返す
			if (relatedModels.length === 0) {
				return true;
			}

			// 関連するレコードを削除
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
		} catch (error) {
			console.error(`Error in deleteRecordInRelatedTable: ${error}`);
			return false;
		}
	}
}
export { DataDeletionCircularImpl };
