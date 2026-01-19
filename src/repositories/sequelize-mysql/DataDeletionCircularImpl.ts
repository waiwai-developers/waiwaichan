import type { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import { injectable } from "inversify";
import type { Model, ModelStatic } from "sequelize";
import { MysqlConnector } from "./MysqlConnector";
import { MysqlSchedulerConnector } from "./MysqlSchedulerConnector";

@injectable()
class DataDeletionCircularImpl implements IDataDeletionCircular {
	async deleteRecordInRelatedTable(
		columnName: ColumnName,
		id: CommunityId | UserId,
	): Promise<boolean> {
		try {
			const columnValue = columnName.getValue();
			const idValue = id.getValue();
			const relatedModels = this.getRelatedModels(columnValue);

			if (relatedModels.length === 0) {
				return true;
			}

			return await Promise.all(
				relatedModels.map((m) =>
					m.destroy({
						where: {
							[columnValue]: idValue,
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

	private getRelatedModels(columnName: string): Array<ModelStatic<Model>> {
		const mysqlSchedulerConnectorModels =
			MysqlSchedulerConnector.models as Array<ModelStatic<Model>>;
		const mysqlConnectorModels = MysqlConnector.models as Array<
			ModelStatic<Model>
		>;
		const models = [...mysqlSchedulerConnectorModels, ...mysqlConnectorModels];

		return models.filter((m) => {
			try {
				return Object.keys(m.getAttributes()).includes(columnName);
			} catch (error) {
				return false;
			}
		});
	}
}
export { DataDeletionCircularImpl };
