/* eslint-disable sonarjs/no-duplicate-string */
import { describe, expect, test } from "vitest";
import { toFnAndImport } from "./format.js";

describe("#unit-test toFnAndImport", () => {
	test("empty string", () => {
		expect(toFnAndImport("")).toStrictEqual({
			str_fn: "",
			str_import: null,
		});
	});

	test("default value", () => {
		expect(toFnAndImport("@Fields.string")).toStrictEqual({
			str_fn: "@Fields.string",
			str_import: null,
		});
	});

	test("custom", () => {
		expect(toFnAndImport("@KitFields.string#@kitql/remult")).toStrictEqual({
			str_fn: "@KitFields.string",
			str_import: "import { KitFields } from '@kitql/remult'",
		});
	});
});
