import { Item } from "./item";
import { Point } from "./point";
import { Reminder } from "./reminder";
import { UserItem } from "./useritem.js";

const models = { UserItem, Item, Point, Reminder };

for (const item of Object.keys(models)) {
	if (models[item].associate) {
		models[item].associate(models);
	}
}

import { MysqlConnector } from "./mysqlConnector.js";
export { MysqlConnector, UserItem, Item, Point, Reminder };
