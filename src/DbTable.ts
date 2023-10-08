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
import type { ForeignKey } from "./postgres/commands.js";
import { toCamelCase, toPascalCase } from "./utils/case.js";
import pluralize from "pluralize";

export interface DbTableForeignKey {
	columnName: string;
	foreignClassName: string;
	isSelfReferenced: boolean;
}

export class DbTable {
	schema: string;
	dbName: string;
	key: string;
	className: string;
	foreignKeys: DbTableForeignKey[];

	constructor(dbName: string, schema: string, foreignKeys: ForeignKey[]) {
		this.schema = schema;
		this.dbName = dbName;

		this.foreignKeys = foreignKeys.map(
			({ foreign_table_name, column_name: columnName }) => {
				return {
					columnName,
					foreignClassName: toPascalCase(foreign_table_name),
					isSelfReferenced: foreign_table_name === dbName,
				};
			},
		);

		this.className = toPascalCase(dbName);

		this.key = pluralize.plural(toCamelCase(this.className));
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
