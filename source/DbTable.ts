import type { ForeignKey } from "./postgres/commands.js";
import { toCamelCase, toPascalCase } from "./utils/case.js";

export class DbTable {
	schema: string;
	dbName: string;
	key: string;
	className: string;
	foreignKeys: {
		columnName: string;
		foreignClassName: string;
		isSelfReferenced: boolean;
	}[];

	constructor(
		dbName: string,
		schema: string,
		foreignKeys: ForeignKey[],
		// TODO: remove it when @jycouet finish with that
		tmp_jyc = false
	) {
		this.schema = schema;
		this.dbName = dbName;

		this.foreignKeys = foreignKeys.map(
			({ foreign_table_name, column_name: columnName }) => {
				return {
					columnName,
					foreignClassName: tmp_jyc
						? toPascalCase(dbName).replace(/^(.{3})/, "$1rrr")
						: toPascalCase(foreign_table_name),
					isSelfReferenced: foreign_table_name === dbName,
				};
			}
		);

		this.className = tmp_jyc
			? toPascalCase(dbName).replace(/^(.{3})/, "$1rrr")
			: toPascalCase(dbName);

		this.key = toCamelCase(this.className) + "s";

		// TODO: kinda hacky provide a custom mapping?
		if (this.key.endsWith("ys")) {
			this.key = this.key.slice(0, -2) + "ies";
		}
	}
}
