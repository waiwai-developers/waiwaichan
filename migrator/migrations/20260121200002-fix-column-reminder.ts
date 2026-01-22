import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Reminders";
const CHANNELS_TABLE_NAME = "Channels";
const COLUMN_NAME_1 = "channelId";
const COLUMN_NAME_2 = "clientId";

export const up: Migration = async ({ context: sequelize }) => {
	// 1. BigintのchannelIdのカラム名をclientIdに変更する
	await sequelize
		.getQueryInterface()
		.renameColumn(TABLE_NAME, COLUMN_NAME_1, COLUMN_NAME_2);

	// 2. 新しくIntegerのchannelIdカラムを追加する
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME_1, {
		type: DataTypes.INTEGER,
	});

	// 3. ChannelsテーブルからclientIdを使ってidを取得しchannelIdにその値を入れる
	await sequelize.query(`
		UPDATE ${TABLE_NAME} AS s
		INNER JOIN ${CHANNELS_TABLE_NAME} AS c ON s.${COLUMN_NAME_2} = c.clientId
		SET s.${COLUMN_NAME_1} = c.id
	`);

	// 4. clientIdのカラムを削除する
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME_2);
};

export const down: Migration = async ({ context: sequelize }) => {
	// 4. clientIdカラムを追加する
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME_2, {
		type: DataTypes.BIGINT,
	});

	// 3. ChannelsテーブルからchannelIdを使ってclientIdを取得しclientIdにその値を入れる
	await sequelize.query(`
		UPDATE ${TABLE_NAME} AS s
		INNER JOIN ${CHANNELS_TABLE_NAME} AS c ON s.${COLUMN_NAME_1} = c.id
		SET s.${COLUMN_NAME_2} = c.clientId
	`);

	// 2. IntegerのchannelIdカラムを削除する
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME_1);

	// 1. clientIdのカラム名をchannelIdに戻す
	await sequelize
		.getQueryInterface()
		.renameColumn(TABLE_NAME, COLUMN_NAME_2, COLUMN_NAME_1);
};
