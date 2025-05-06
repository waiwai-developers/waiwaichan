import type { Datafix } from "@/migrator/umzug";
import { DatafixCandyModel } from "./models/DatafixCandyModel";
import  { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";

export const up: Datafix = async () => {
	const candies = await DatafixCandyModel.findAll(
        {
			where: {
				categoryType: null,
			},
		}
	);

	await Promise.all(
		candies.map(async (t) => {
			t.update({
				categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
		    })
        })
    )
};
