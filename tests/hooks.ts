import "reflect-metadata";
import "@swc-node/register";
import { ContainerDown, ContainerUp } from "@/tests/fixtures/database/ContainerTest";
export const mochaHooks = {
	beforeAll: [
		async function () {
			process.env.NODE_ENV = "test";
			// @ts-ignore
			this.timeout(150_000);
			await ContainerUp();
		},
	],
	afterAll: [
		async function () {
			// @ts-ignore
			this.timeout(150_000);
			await ContainerDown();
		},
	],
};
