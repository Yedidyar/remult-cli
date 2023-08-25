#!/usr/bin/env node

import { generateModels } from "./getEntityTypescriptPostgres.js";
import {
	intro,
	outro,
	confirm,
	spinner,
	isCancel,
	cancel,
	text,
} from "@clack/prompts";
import { setTimeout as sleep } from "node:timers/promises";

async function main() {
	console.log();
	intro(" remult cli ");

	const connectionString = await text({
		message: "connectionString",
		placeholder: "postgres://user:pass@host:port/db-name",
	});

	if (isCancel(connectionString)) {
		cancel("Operation cancelled");
		return process.exit(0);
	}

	const shouldContinue = await confirm({
		message: "Do you want to continue?",
	});

	if (isCancel(shouldContinue)) {
		cancel("Operation cancelled");
		return process.exit(0);
	}

	const s = spinner();
	s.start("generating...");

	generateModels(connectionString, ["actor"]);

	s.stop("generating...");

	outro("You're all set!");

	await sleep(1000);
}

main().catch(console.error);
