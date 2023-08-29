#!/usr/bin/env node

import { getEntitiesTypescriptPostgres } from "./getEntityTypescriptPostgres.js";
import yargs from "yargs/yargs";

async function main() {
	const { connectionString, output } = await yargs(process.argv.slice(2))
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
		})
		.example([
			["remult --connectionString postgres://user:pass@host:port/db-name"],
		]).argv;

	await getEntitiesTypescriptPostgres(connectionString, output);
}

main().catch(console.error);
