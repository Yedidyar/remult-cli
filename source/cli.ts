#!/usr/bin/env node

import { getEntitiesTypescriptPostgres } from "./getEntityTypescriptPostgres.js";
import yargs from "yargs/yargs";

async function main() {
	const { connectionString, output, tmp_jyc } = await yargs(
		process.argv.slice(2)
	)
		.options({
			connectionString: {
				type: "string",
				demandOption: true,
				description:
					"Your PostgreSQL database connection string. Only PostgreSQL databases are supported.",
			},
			output: {
				default: "./src/shared",
			},
			tmp_jyc: {
				type: "boolean",
				hidden: true,
			},
		})
		.example([
			["remult --connectionString postgres://user:pass@host:port/db-name"],
		]).argv;

	await getEntitiesTypescriptPostgres(connectionString, output, tmp_jyc);
}

main().catch(console.error);
