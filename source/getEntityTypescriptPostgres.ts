import { mkdirSync, rmSync, writeFileSync } from "fs";
import { createPostgresDataProvider } from "remult/postgres";
import { toPascalCase, toTitleCase } from "./utils/case.js";
import {
	getEnumDef,
	getForeignKeys,
	getTableColumnInfo,
	getTablesInfo,
} from "./postgres/commands.js";
import { DbTable } from "./DbTable.js";
import { CliReport, logReport } from "./report.js";

function build_column(
	decorator: string,
	decoratorArgsValueType: string,
	decoratorArgsOptions: string[],
	column_name_tweak: string | null,
	column_name: any,
	is_nullable: "YES" | "NO",
	type: string | null,
	defaultVal: string | null
) {
	if (
		column_name.toLocaleLowerCase() !== column_name ||
		column_name_tweak ||
		column_name === "order"
	) {
		decoratorArgsOptions.unshift(`dbName: '"${column_name}"'`);
	}

	if (is_nullable === "YES") {
		decoratorArgsOptions.push(`allowNull: true`);
	}

	let decoratorArgs = [];
	if (decoratorArgsValueType) {
		decoratorArgs.push(decoratorArgsValueType);
	}

	if (decoratorArgsOptions.length > 0) {
		decoratorArgs.push(`{ ${decoratorArgsOptions.join(", ")} }`);
	}

	let current_col = `\t${decorator}(${decoratorArgs.join(", ")})\n\t${
		column_name_tweak ? column_name_tweak : column_name
	}`;

	if (is_nullable === "YES") {
		current_col += "?";
	}
	if (is_nullable !== "YES" && !defaultVal) {
		current_col += "!";
	}

	if (type) {
		current_col += ": ";
		current_col += type;
	}
	if (defaultVal) {
		current_col += " = " + defaultVal;
	}

	return current_col;
}

// TODO: everything optionnal
export async function getEntitiesTypescriptPostgres(
	connectionString: string,
	schema = "public",
	exclude = [
		"pg_stat_statements",
		"pg_stat_statements_info",
		"_prisma_migrations",
	],
	include: string[] = [],
	reportKind: "no" | "numbers" | "full" = "full"
) {
	const report = { noTableMatchingforeignKey: [], typeCouldBeBetter: [] };

	const provider = await createPostgresDataProvider({
		connectionString,
	});

	const tableInfo = await getTablesInfo(provider);
	const foreignKeys = await getForeignKeys(provider);

	rmSync("./src/shared", { recursive: true, force: true });

	mkdirSync("./src/shared/", { recursive: true });
	const entities_path = "./src/shared/entities/";
	mkdirSync(entities_path);
	const enums_path = "./src/shared/enums/";
	mkdirSync(enums_path);

	const allTables = tableInfo.map((table) => {
		const tableForeignKeys = foreignKeys.filter(
			({ table_name }) => table.table_name === table_name
		);

		return new DbTable(table.table_name, table.table_schema, tableForeignKeys);
	});

	// build the list of classes first (for foreign keys link later)
	const tablesGenerated: DbTable[] = [];
	await Promise.all(
		allTables
			// let's generate schema by schema
			.filter((c) => c.schema === schema)
			.map(async (table) => {
				try {
					if (
						!exclude.includes(table.dbName) &&
						(include.length === 0 || include.includes(table.dbName))
					) {
						const data = await getEntityTypescriptPostgres(
							connectionString,
							enums_path,
							table,
							schema,
							report
						);
						writeFileSync(`${entities_path}${table.className}.ts`, data);
						tablesGenerated.push(table);
					}
				} catch (error) {
					console.error(error);
				}
			})
	);

	// write "_entities.ts"
	writeFileSync(
		`${entities_path}_entities.ts`,
		`${tablesGenerated
			.sort((a, b) => a.className.localeCompare(b.className))
			.map((e) => {
				return `import { ${e.className} } from './${e.className}';`;
			})
			.join("\n")}

export const entities = [
  ${tablesGenerated
		.sort((a, b) => a.className.localeCompare(b.className))
		.map((c) => c.className)
		.join(",\n  ")}
]`
	);

	logReport(reportKind, report);
}

async function getEntityTypescriptPostgres(
	connectionString: string,
	enums_path: string,
	table: DbTable,
	schema: string,
	report: CliReport
) {
	const provider = await createPostgresDataProvider({
		connectionString,
	});

	let enums: Record<string, string[]> = {};

	let cols = [];
	let props = [];
	props.push("allowApiCrud: true");
	if (table.dbName !== table.className) {
		if (table.schema === "public" && table.dbName === "user") {
			// TODO fix dbName should be able to take a schema
			props.push(`// dbName: '${table.dbName}'`);
			props.push(`sqlExpression: 'public.${table.dbName}'`);
		} else {
			props.push(`dbName: '${table.dbName}'`);
		}
	}

	let defaultOrderBy: string = undefined!;
	for (const {
		column_name,
		column_default,
		data_type,
		datetime_precision,
		character_maximum_length,
		udt_name,
		is_nullable,
	} of await getTableColumnInfo(provider, schema, table.dbName)) {
		let decorator = "@Fields.string";

		let decoratorArgsValueType: string = "";
		let decoratorArgsOptions: string[] = [];
		let type: string | null = "string";
		let defaultVal = null;
		let column_name_tweak: string | null = null;

		switch (data_type) {
			case "decimal":
			case "real":
			case "int":
			case "integer":
			case "smallint":
			case "tinyint":
				type = "number";
				defaultVal = null;
				decorator = "@Fields.integer";
				if (column_default?.startsWith("nextval")) {
					decorator = "@Fields.autoIncrement";
				}
				break;
			case "bigint":
			case "float":
			case "numeric":
			case "NUMBER":
			case "money":
			case "double precision":
				type = "number";
				defaultVal = null;
				if (datetime_precision === 0) {
					decorator = "@Fields.integer";
				} else {
					decorator = "@Fields.number";
				}
				// defaultVal = '0'
				break;
			case "nchar":
			case "nvarchar":
			case "ntext":
			case "NVARCHAR2":
			case "text":
			case "varchar":
			case "VARCHAR2":
				if (column_name === "id") {
					decorator = "@Fields.cuid";
					type = "string";
					defaultVal = null;
				}
				break;
			case "character varying":
				break;
			case "char":
			case "CHAR":
				if (character_maximum_length == 8 && column_default == "('00000000')") {
					decorator = "@Fields.dateOnly";
					type = "Date";
				}
				break;
			case "date":
			case "DATE":
			case "datetime":
			case "datetime2":
			case "timestamp without time zone":
				if (column_name === "createdAt" || column_name === "dateCreated") {
					decorator = "@Fields.createdAt";
					type = null; // will be inferred
					defaultVal = "new Date()";
				} else if (column_name === "updatedAt") {
					decorator = "@Fields.updatedAt";
					type = null; // will be inferred
					defaultVal = "new Date()";
				} else {
					decorator = "@Fields.date";
					type = "Date";
					defaultVal = null;
				}
				break;
			case "bit":
			case "boolean":
				decorator = "@Fields.boolean";
				type = "boolean";
				break;
			case "ARRAY":
				decorator = "@Fields.json";
				type = null;
				defaultVal = "[]";

				// TODO: We can probably do better
				report.typeCouldBeBetter.push(
					`For table ["${table.dbName}"] column ["${column_name}"] => The type is not specified.`
				);
				break;
			case "USER-DEFINED":
				decorator = `@Field`;
				decoratorArgsValueType += `() => ${toPascalCase(udt_name)}`;
				type = null;
				if (column_default === null) {
					defaultVal = "null";
				} else {
					defaultVal =
						toPascalCase(udt_name) + "." + column_default.split("'")[1];
				}

				const enumDef = await getEnumDef(provider, udt_name);

				enums[toPascalCase(udt_name)] = enumDef.map((e) => e.enumlabel);
				break;
			default:
				console.log("unmanaged", {
					tableObj: JSON.stringify(table),
					column_name,
					data_type,
					character_maximum_length,
					column_default,
					udt_name,
				});
				break;
		}

		if (
			!defaultOrderBy &&
			(column_name === "order" ||
				column_name === "name" ||
				column_name === "nom")
		) {
			defaultOrderBy = column_name;
		}

		let current_col = build_column(
			decorator,
			decoratorArgsValueType,
			decoratorArgsOptions,
			column_name_tweak,
			column_name,
			is_nullable,
			type,
			defaultVal
		);

		// do we have a foreign key ?
		const foreign_key = table.foreignKeys.find(
			(f) => f.columnName === column_name
		);
		let current_col_fk: string | undefined;
		if (foreign_key) {
			current_col_fk = build_column(
				"@Field",
				`() => ${foreign_key.foreignClassName}`,
				["lazy: true"],
				column_name.replace(/Id$/, ""),
				column_name,
				"YES",
				foreign_key.foreignClassName,
				null
			);
		}

		if (current_col_fk) {
			cols.push(current_col_fk + `\n`);
		} else {
			cols.push(current_col + `\n`);
		}
	}

	if (defaultOrderBy) {
		props.push(`defaultOrderBy: { ${defaultOrderBy}: 'asc' }`);
	}

	function addLineIfNeeded(array: any[], format: (item: string[]) => string) {
		if (array.length > 0) {
			return `\n${array.map(format).join("\n")}`;
		}
		return ``;
	}

	const foreignClassNames = table.foreignKeys.map(
		({ foreignClassName }) => foreignClassName
	);

	let r =
		`import { Entity, ${
			foreignClassNames.length > 0 ? "Field," : ""
		}Fields } from 'remult'` +
		`${addLineIfNeeded(
			foreignClassNames,
			(c) => `import { ${c} } from './${c}'`
		)}` +
		`${addLineIfNeeded(
			Object.keys(enums),
			(c) => `import { ${c} } from '../enums/${c}'`
		)}

@Entity<${table.className}>('${table.key}', {\n\t${props.join(",\n\t")}\n})
export class ${table.className} {
${cols.join(`\n`)}}
`;

	// write enums
	for (const enumName in enums) {
		const enumValues = enums[enumName];
		writeFileSync(
			`${enums_path}${enumName}.ts`,
			`import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class ${enumName} {
  ${enumValues
		?.map((e) => `static ${e} = new ${enumName}('${e}', '${toTitleCase(e)}')`)
		.join("\n  ")}

  constructor(public id: string, public caption: string) {}
}
`
		);
	}

	return r;
}
