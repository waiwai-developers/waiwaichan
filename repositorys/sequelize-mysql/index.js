import { Item } from "./item.js";
import { Point } from "./point.js";
import { Reminder } from "./reminder.js";
import { UserItem } from "./useritem.js";

const models = { UserItem, Item, Point, Reminder };

for (const item of Object.keys(models)) {
	if (models[item].associate) {
		models[item].associate(models);
	}
}

import { MysqlConnector } from "./mysqlConnector.js";
export { MysqlConnector, UserItem, Item, Point, Reminder };
