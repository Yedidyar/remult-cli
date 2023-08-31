import { green, yellow } from "kleur/colors";
import * as p from "@clack/prompts";

export interface CliReport {
	typeCouldBeBetter: string[];
}

export const logReport = (
	reportKind: "no" | "numbers" | "full",
	report: CliReport
) => {
	if (reportKind === "no") {
		return;
	}

	if (reportKind === "full") {
		// No table matching found

		p.log.info(
			`${green(`Type need to be manually typed`)}:
  ${yellow(report.typeCouldBeBetter.join("\n  "))}`
		);
	} else if (reportKind === "numbers") {
		p.log.info(
			`${green(`Type need to be manually typed`)}: ${yellow(
				report.typeCouldBeBetter.length
			)}`
		);
	}
};
