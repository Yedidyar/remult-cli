import { green, yellow } from "@kitql/helpers";
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
		if (report.typeCouldBeBetter.length > 0) {
			p.log.info(
				`${green(`Type need to be manually typed`)}:
  ${yellow(report.typeCouldBeBetter.join("\n  "))}`,
			);
		}
		if (report.sAdded.length > 0) {
			p.log.info(
				`${green(`We added an "s" to the key to avoid collision on`)}:
  ${report.sAdded.join("\n  ")}`,
			);
		}

		return;
	}

	if (reportKind === "numbers") {
		if (report.typeCouldBeBetter.length > 0) {
			p.log.info(
				`${green(`Type need to be manually typed`)}: ${yellow(
					report.typeCouldBeBetter.length.toString(),
				)}`,
			);
		}
		if (report.sAdded.length > 0) {
			p.log.info(
				`${green(`We added an "s" to the key to avoid collision on`)}: ${yellow(
					report.sAdded.length.toString(),
				)}`,
			);
		}
		return;
	}

	// make sure all reportKinds was exhausted
	reportKind satisfies never;
};
