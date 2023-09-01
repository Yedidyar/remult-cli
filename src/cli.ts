#!/usr/bin/env node

import dotenv from "dotenv";
import yargs from "yargs/yargs";
import { getEntitiesTypescriptPostgres } from "./getEntityTypescriptPostgres.js";

import * as p from "@clack/prompts";
import { logReport } from "./report.js";
import { green } from "kleur/colors";

dotenv.config();

function pCancel(cancelText = "Operation cancelled.") {
	p.cancel(cancelText);
	process.exit(1);
}

async function main() {
	const {
		output,
		tableProps,
		customDecorators,
		tmpJyc,
		defaultOrderBy,
		...args
	} = await yargs(process.argv.slice(2))
		.options({
			"connection-string": {
				default: process.env["DATABASE_URL"],
				description:
					"Your PostgreSQL database connection string. Only PostgreSQL databases are supported.",
			},
			output: {
				default: process.env["OUTPUT"] ?? "./src/shared",
			},
			"table-props": {
				default: process.env["TABLE_PROPS"] ?? "allowApiCrud: true",
				description: `Example only authenticated, set: "allowApiCrud: (r) => r?.authenticated() ?? false"`,
			},
			"tmp-jyc": {
				type: "boolean",
				hidden: true,
				default: process.env["TMP_JYC"] === "true",
			},
			"custom-decorators": {
				type: "string",
				hidden: true,
				default: process.env["CUSTOM_DECORATORS"] ?? "{}",
				description: `Example CUSTOM_DECORATORS = '{"@Fields.string":"@MyFields.string#./MyFields"}', it will be JSON parsed!
Like this, '@Fields.string' will be replaced by '@MyFields.string' and 'MyFields' is imported from './MyFields'
You can use it to replace the default decorators by your own, extending Remult ones.`,
			},
			"default-order-by": {
				type: "array",
				array: true,
				default: process.env["DEFAULT_ORDER_BY"]?.split(", ") ?? [
					"order",
					"name",
				],
			},
		})
		.example([
			["remult-cli --connectionString postgres://user:pass@host:port/db-name"],
		]).argv;

	p.intro("🎉 Welcome to remult-cli!");

	if (!args.connectionString) {
		const answer = await p.group(
			{
				connectionString: async () =>
					p.text({
						message: `What's your connectionString?`,
						placeholder:
							"  (type it here or restart with --connectionString or a .env file containing DATABASE_URL)",
						validate: (value) => {
							if (value === "") {
								return "Please enter something";
							}

							if (!value.startsWith("postgres")) {
								return "Please enter a valid connexion string like: postgres://user:pass@host:port/db-name";
							}
						},
					}),
			},
			{
				onCancel: () => pCancel(),
			}
		);
		args.connectionString = answer.connectionString;
	}

	let customDecoratorsJSON = {};
	try {
		customDecoratorsJSON = JSON.parse(customDecorators);
	} catch (error) {
		if (error instanceof Error) {
			p.cancel(error.message);
		}
	}

	const spinner = p.spinner();
	spinner.start("Generating everything for you");
	const report = await getEntitiesTypescriptPostgres(
		args.connectionString,
		output,
		tableProps,
		defaultOrderBy,
		customDecoratorsJSON,
		tmpJyc
	);
	spinner.stop(`Generation done ${green("✓")}`);

	logReport("full", report);

	p.outro(`🎉 Everything is ready!`);

	process.exit(0);
}

main().catch(console.error);
