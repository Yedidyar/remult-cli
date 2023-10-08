#!/usr/bin/env node

import dotenv from "dotenv";
import yargs from "yargs/yargs";
import { getEntitiesTypescriptPostgres } from "./getEntityTypescriptPostgres.js";

import * as p from "@clack/prompts";
import { logReport } from "./report.js";
import { green } from "kleur/colors";
import { SqlDatabase } from "remult";
import { createPostgresDataProvider } from "remult/postgres";

dotenv.config();

function pCancel(cancelText = "Operation cancelled.") {
	p.cancel(cancelText);
	process.exit(1);
}

const options = {
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
	"with-enums": {
		default: process.env["WITH_ENUMS"]
			? process.env["WITH_ENUMS"] === "true"
			: true,
		description: `Example you don't want to overwrite your enums, set: "false" (default: "true")`,
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
		default: process.env["DEFAULT_ORDER_BY"]
			?.split(",")
			.map((c) => c.trim()) ?? ["order", "name"],
	},
	schemas: {
		type: "array",
		array: true,
		default: process.env["SCHEMAS"]?.split(",").map((c) => c.trim()) ?? [
			"public",
		],
	},
	exclude: {
		type: "array",
		array: true,
		default: process.env["EXCLUDE"]?.split(",").map((c) => c.trim()) ?? [
			"pg_stat_statements",
			"pg_stat_statements_info",
			"_prisma_migrations",
		],
	},
	include: {
		type: "array",
		array: true,
		default: process.env["INCLUDE"]?.split(",").map((c) => c.trim()) ?? [],
	},
} as const;

async function main() {
	const {
		output,
		tableProps,
		customDecorators,
		withEnums,
		tmpJyc,
		defaultOrderBy,
		schemas,
		exclude,
		include,
		...args
	} = await yargs(process.argv.slice(2))
		.options(options)
		.example([
			["remult-cli --connectionString postgres://user:pass@host:port/db-name"],
		]).argv;

	p.intro("🎉 Welcome to remult-cli!");

	args.connectionString ??= await getConnectionStringFromPrompt();

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

	let provider: SqlDatabase | null = null;
	try {
		provider = await createPostgresDataProvider({
			connectionString: args.connectionString,
		});
	} catch (error) {
		throw new Error(
			"Could not connect to the database, check your connectionString",
		);
	}

	try {
		const report = await getEntitiesTypescriptPostgres(
			provider,
			output,
			tableProps,
			defaultOrderBy,
			customDecoratorsJSON,
			withEnums,
			schemas,
			exclude,
			include,
		);
		spinner.stop(`Generation done ${green("✓")}`);

		logReport("full", report);
	} catch (error: unknown) {
		if (error instanceof Error) {
			pCancel(error.message);
		}
	}

	p.outro(`🎉 Everything is ready!`);

	process.exit(0);
}

main().catch(console.error);

async function getConnectionStringFromPrompt() {
	const answer = await p.group(
		{
			connectionString: () =>
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
		},
	);
	return answer.connectionString;
}
