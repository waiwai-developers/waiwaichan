import "reflect-metadata";
import "@swc-node/register";
import { ContainerDown, ContainerUp } from "@/tests/fixtures/database/ContainerTest";
export const mochaHooks = {
	beforeAll: [
		async function () {
			process.env.NODE_ENV = "test";
			this.timeout(150_000);
			await ContainerUp();
		},
	],
	afterAll: [
		async function () {
			this.timeout(150_000);
			await ContainerDown();
		},
	],
};
