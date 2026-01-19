import type { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import { injectable } from "inversify";
import type { Model, ModelStatic } from "sequelize";
import { MysqlConnector } from "./MysqlConnector";
import { MysqlSchedulerConnector } from "./MysqlSchedulerConnector";

@injectable()
class DataDeletionCircularImpl implements IDataDeletionCircular {
	async deleteRecordInRelatedTable(
		...columnAndIds: Array<[
			ColumnName,
			CommunityId | CommunityClientId | UserId | UserClientId,
		]>
	): Promise<boolean> {
		try {
			const columnValues = columnAndIds.map(([columnName]) =>
				columnName.getValue(),
			);
			const idValues = columnAndIds.map(([, id]) => id.getValue());
			const relatedModels = this.getRelatedModels(columnValues);

			if (relatedModels.length === 0) {
				return true;
			}

			return await Promise.all(
				relatedModels.map((model) => {
					const attributes = Object.keys(model.getAttributes());
					const deletions = columnValues
						.map((columnValue, index) => ({
							columnValue,
							idValue: idValues[index],
						}))
						.filter(({ columnValue }) => attributes.includes(columnValue))
						.map(({ columnValue, idValue }) =>
							model.destroy({
								where: {
									[columnValue]: idValue,
								},
							}),
						);

					return deletions.length > 0
						? Promise.all(deletions)
						: Promise.resolve([0]);
				}),
			).then((results) =>
				results
					.flat()
					.map((res) => res >= 0)
					.reduce((acc, curr) => acc && curr, true),
			);
		} catch (error) {
			console.error(`Error in deleteRecordInRelatedTable: ${error}`);
			return false;
		}
	}

	private getRelatedModels(columnNames: string[]): Array<ModelStatic<Model>> {
		const mysqlSchedulerConnectorModels =
			MysqlSchedulerConnector.models as Array<ModelStatic<Model>>;
		const mysqlConnectorModels = MysqlConnector.models as Array<
			ModelStatic<Model>
		>;
		const models = [...mysqlSchedulerConnectorModels, ...mysqlConnectorModels];

		return models.filter((model) => {
			try {
				const attributes = Object.keys(model.getAttributes());
				return columnNames.some((columnName) =>
					attributes.includes(columnName),
				);
			} catch (error) {
				return false;
			}
		});
	}
}
export { DataDeletionCircularImpl };
