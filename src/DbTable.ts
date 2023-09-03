import type { ForeignKey } from "./postgres/commands.js";
import { toPascalCase } from "./utils/case.js";
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

	constructor(
		dbName: string,
		schema: string,
		foreignKeys: ForeignKey[],
		// TODO: remove it when @jycouet finish with that
		tmp_jyc = false,
	) {
		this.schema = schema;
		this.dbName = dbName;

		this.foreignKeys = foreignKeys.map(
			({ foreign_table_name, column_name: columnName }) => {
				return {
					columnName,
					foreignClassName: tmp_jyc
						? toPascalCase(foreign_table_name).replace(/^(.{3})/, "$1rrr")
						: toPascalCase(foreign_table_name),
					isSelfReferenced: foreign_table_name === dbName,
				};
			},
		);

		this.className = tmp_jyc
			? toPascalCase(dbName).replace(/^(.{3})/, "$1rrr")
			: toPascalCase(dbName);

		this.key = pluralize.plural(this.className);
	}
}
