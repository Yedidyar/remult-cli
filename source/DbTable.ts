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

	constructor(dbName: string, schema: string, foreignKeys: ForeignKey[]) {
		this.schema = schema;
		this.dbName = dbName;

		this.foreignKeys = foreignKeys.map(
			({ foreign_table_name, column_name: columnName }) => ({
				columnName,
				foreignClassName: toPascalCase(foreign_table_name),
				isSelfReferenced: foreign_table_name === dbName,
			})
		);
		this.className = toPascalCase(dbName);

		this.key = toCamelCase(this.className) + "s";

		// TODO: kinda hacky provide a custom mapping?
		if (this.key.endsWith("ys")) {
			this.key = this.key.slice(0, -2) + "ies";
		}
	}
}
