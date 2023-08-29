import { green, yellow } from "kleur/colors";

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

	console.log(green(` === Remult cli ===`));
	if (reportKind === "full") {
		// No table matching found

		console.log(
			` - ${green(`Type need to be manually typed`)}:
     ${yellow(report.typeCouldBeBetter.map((c) => `${c}`).join("\n     "))}`
		);
	} else if (reportKind === "numbers") {
		console.log(
			` - ${green(`Type need to be manually typed`)}: ${yellow(
				report.typeCouldBeBetter.length
			)}`
		);
	}
	console.log(green(` ==================`));
};
