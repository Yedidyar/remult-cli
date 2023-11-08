import {
	gray,
	green,
	italic,
	yellow,
	cyan,
	bold,
	strikethrough,
	red,
} from "kleur/colors";
import type { ForeignKey } from "./types.js";
import { toCamelCase, toPascalCase } from "../utils/case.js";
import pluralize from "pluralize";

export interface DbTableForeignKey {
	columnName: string;
	foreignDbName: string;
}

export class DbTable {
	schema: string;
	dbName: string;
	key: string;
	className: string;
	foreignKeys: DbTableForeignKey[];

	constructor(
		dbName: string,
		schema: string,
		schemasPrefix: "NEVER" | "ALWAYS" | "SMART" = "SMART",
		foreignKeys: ForeignKey[],
	) {
		this.schema = schema;
		this.dbName = dbName;

		this.foreignKeys = foreignKeys.map(
			({ foreign_table_name, column_name: columnName }) => {
				return {
					columnName,
					foreignDbName: foreign_table_name,
				};
			},
		);

		const plur = toPascalCase(pluralize.plural(dbName));
		const sing = toPascalCase(pluralize.singular(dbName));

		if (schemasPrefix === "NEVER") {
			this.className = sing;
		} else if (schemasPrefix === "ALWAYS") {
			this.className = `${toPascalCase(schema)}_${sing}`;
		} else {
			if (schema === "public") {
				this.className = sing;
			} else {
				this.className = `${toPascalCase(schema)}_${sing}`;
			}
		}
		this.key = toCamelCase(plur);
	}

	checkNamingConvention() {
		if (this.key === toCamelCase(this.className)) {
			const ccClassName = toCamelCase(this.className);
			const newKey = `${this.key}s`;

			const str =
				`Your table "${green(this.dbName)}"` +
				` generates` +
				` ${cyan(
					`{ className: "${yellow(this.className)}"` +
						` ${italic(gray(`(camelCase: "${yellow(ccClassName)}")`))},` +
						` key: "${red(strikethrough(this.key))}${green(bold(newKey))}" }`,
				)}.`;

			this.key = newKey;

			return str;
		}
		return null;
	}
}
