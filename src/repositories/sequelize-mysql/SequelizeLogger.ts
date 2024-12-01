export const SequelizeLogger = (sql: string, timing: number | undefined) => {
	// @ts-ignore
	if (typeof timing === "object" && timing?.bind) {
		//@ts-ignore
		const bind = timing.bind;
		console.log(`${sql} params:{${bind}}`);
	} else {
		console.log(sql);
	}
};
