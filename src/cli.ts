#!/usr/bin/env node

import { getEntitiesTypescriptPostgres } from "./getEntityTypescriptPostgres.js";
import yargs from "yargs/yargs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
	const { connectionString, output, tmp_jyc } = await yargs(
		process.argv.slice(2)
	)
		.options({
			connectionString: {
				type: "string",
				demandOption: true,
				default: process.env["DATABASE_URL"],
				description:
					"Your PostgreSQL database connection string. Only PostgreSQL databases are supported.",
			},
			output: {
				default: process.env["OUTPUT"] ?? "./src/shared",
			},
			tmp_jyc: {
				type: "boolean",
				hidden: true,
				default: process.env["TMP_JYC"] === "true" ? true : false,
			},
		})
		.example([
			["remult --connectionString postgres://user:pass@host:port/db-name"],
		]).argv;

	await getEntitiesTypescriptPostgres(connectionString, output, tmp_jyc);
}

main().catch(console.error);
