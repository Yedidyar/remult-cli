import { green, yellow } from "kleur/colors";
import * as p from "@clack/prompts";

export interface CliReport {
	typeCouldBeBetter: string[];
	sAdded: string[];
}

export const logReport = (
	reportKind: "no" | "numbers" | "full",
	report: CliReport,
) => {
	if (reportKind === "no") {
		return;
	}

	if (reportKind === "full") {
		// No table matching found
		p.log.info(
			`${green(`Type need to be manually typed`)}:
  ${yellow(report.typeCouldBeBetter.join("\n  "))}`,
		);
		p.log.info(
			`${green(`We added an "s" to the key to avoid collision on`)}:
  ${report.sAdded.join("\n  ")}`,
		);
	} else if (reportKind === "numbers") {
		p.log.info(
			`${green(`Type need to be manually typed`)}: ${yellow(
				report.typeCouldBeBetter.length,
			)}`,
		);
		p.log.info(
			`${green(`"s" added to the key to avoid collision`)}: ${yellow(
				report.sAdded.length,
			)}`,
		);
	}
};
