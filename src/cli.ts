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
		connectionString: connectionString_cli,
		output,
		tableProps,
		tmp_jyc,
	} = await yargs(process.argv.slice(2))
		.options({
			connectionString: {
				default: process.env["DATABASE_URL"],
				description:
					"Your PostgreSQL database connection string. Only PostgreSQL databases are supported.",
			},
			output: {
				default: process.env["OUTPUT"] ?? "./src/shared",
			},
			tableProps: {
				default: process.env["TABLE_PROPS"] ?? "allowApiCrud: true",
				description: `Example only authenticated, set: "allowApiCrud: (r) => r?.authenticated() ?? false"`,
			},
			tmp_jyc: {
				type: "boolean",
				hidden: true,
				default: process.env["TMP_JYC"] === "true" ? true : false,
			},
		})
		.example([
			["remult-cli --connectionString postgres://user:pass@host:port/db-name"],
		]).argv;

	p.intro("🎉 Welcome to remult-cli!");

	let connectionString = connectionString_cli;
	if (!connectionString_cli) {
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

							return;
						},
					}),
			},
			{
				onCancel: () => pCancel(),
			}
		);
		connectionString = answer.connectionString;
	}

	const spinner = p.spinner();
	spinner.start("Generating everything for you");
	const report = await getEntitiesTypescriptPostgres(
		connectionString,
		output,
		tableProps,
		tmp_jyc
	);
	spinner.stop(`Generation done ${green(`✓`)}`);

	logReport("full", report);

	p.outro(`🎉 Everything is ready!`);

	process.exit(0);
}

main().catch(console.error);
