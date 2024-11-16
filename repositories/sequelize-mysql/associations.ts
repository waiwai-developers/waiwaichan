import { PointItemRepositoryImpl } from "./PointItemRepositoryImpl";
import { UserPointItemRepositoryImpl } from "./UserPointItemRepositoryImpl";

PointItemRepositoryImpl.hasMany(UserPointItemRepositoryImpl, {
	foreignKey: "itemId",
});

UserPointItemRepositoryImpl.belongsTo(PointItemRepositoryImpl, {
	as: "item",
	foreignKey: "itemId",
});
