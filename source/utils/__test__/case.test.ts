import { expect, test, describe } from "vitest";
import { toCamelCase, toPascalCase, toTitleCase } from "../case.js";

describe("#unit-test toPascalCase", () => {
	test("empty string", () => {
		expect(toPascalCase("")).toBe("");
	});
	test("from PascalCase", () => {
		expect(toPascalCase("PascalCase")).toBe("PascalCase");
	});
	test("from camelCase", () => {
		expect(toPascalCase("camelCase")).toBe("CamelCase");
	});
	test("from kabab-case", () => {
		expect(toPascalCase("kabab-case")).toBe("KababCase");
	});
	test("from snake_case", () => {
		expect(toPascalCase("snake_case")).toBe("SnakeCase");
	});
});

describe("#unit-test toCamelCase", () => {
	test("empty string", () => {
		expect(toCamelCase("")).toBe("");
	});
	test("from PascalCase", () => {
		expect(toCamelCase("PascalCase")).toBe("pascalCase");
	});
	test("from camelCase", () => {
		expect(toCamelCase("camelCase")).toBe("camelCase");
	});
	test("from kabab-case", () => {
		expect(toCamelCase("kabab-case")).toBe("kababCase");
	});
	test("from snake_case", () => {
		expect(toCamelCase("snake_case")).toBe("snakeCase");
	});
});

describe("#unit-test toTitleCase", () => {
	test("empty string", () => {
		expect(toTitleCase("")).toBe("");
	});
	test("from PascalCase", () => {
		expect(toTitleCase("PascalCase")).toBe("Pascal Case");
	});
	test("from camelCase", () => {
		expect(toTitleCase("camelCase")).toBe("Camel Case");
	});
	test("from kabab-case", () => {
		expect(toTitleCase("kabab-case")).toBe("Kabab Case");
	});
	test("from snake_case", () => {
		expect(toTitleCase("snake_case")).toBe("Snake Case");
	});
	test("from ALL_CAPS", () => {
		expect(toTitleCase("ALL_DAY")).toBe("All Day");
	});
});
