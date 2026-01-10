import "reflect-metadata";
import "@swc-node/register";
import { ContainerUp } from "@/tests/fixtures/database/ContainerTest";
export const mochaHooks = {
	beforeAll: [
		async function () {
			process.env.NODE_ENV = "testing";
			// @ts-ignore
			this.timeout(150_000);
			await ContainerUp();
		},
	],
	afterAll: [
		async function () {
			// @ts-ignoreßß
			this.timeout(150_000);
		},
	],
};
