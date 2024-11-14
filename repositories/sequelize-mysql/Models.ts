import type { Model, ModelStatic } from "sequelize";

export interface IModels {
	UserPointItem: ModelStatic<Model>;
	PointItem: ModelStatic<Model>;
	Point: ModelStatic<Model>;
	Reminder: ModelStatic<Model>;
}
