import type { ColumnDto } from "@/src/entities/dto/Column";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import { injectable } from "inversify";
import type { Model, ModelStatic } from "sequelize";
import { MysqlConnector } from "./MysqlConnector";
import { MysqlSchedulerConnector } from "./MysqlSchedulerConnector";

@injectable()
class DataDeletionCircularImpl implements IDataDeletionCircular {
	async deleteRecordInRelatedTable(data: ColumnDto): Promise<boolean> {
		try {
			const columnName = data.columnName.getValue();
			const columnId = data.columnId.getValue();
			const relatedModels = this.getRelatedModels([columnName]);

			if (relatedModels.length === 0) {
				return true;
			}

			const results = await Promise.all(
				relatedModels.map((model) =>
					model.destroy({
						where: {
							[columnName]: columnId,
						},
					}),
				),
			);

			return results.every((res) => res >= 0);
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
