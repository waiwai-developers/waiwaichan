import type { Datafix } from "@/migrator/umzug";
import { DatafixThreadModel } from "./models/DatafixThreadModel";
import  { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";

export const up: Datafix = async () => {
	const threads = await DatafixThreadModel.findAll(
        {
			where: {
				categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
			},
		}
	);
	await Promise.all(
		threads.map(async (t) => {
			t.update({
				metadata: JSON.parse('{}')
		    })
        })
    )
};
