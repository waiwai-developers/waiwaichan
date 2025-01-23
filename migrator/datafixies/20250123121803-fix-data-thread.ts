import type { Datafix } from "@/migrator/umzug";
import { DatafixThreadModel } from "./models/DatafixThreadModel";

export const up: Datafix = async () => {
	const threads = await DatafixThreadModel.findAll(
        {
			where: {
				metadata: null,
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
