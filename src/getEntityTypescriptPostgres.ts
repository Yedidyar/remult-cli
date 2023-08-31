import { mkdirSync, rmSync, writeFileSync } from "fs";
import { createPostgresDataProvider } from "remult/postgres";
import { DbTable } from "./DbTable.js";
import {
	getEnumDef,
	getForeignKeys,
	getTableColumnInfo,
	getTablesInfo,
} from "./postgres/commands.js";
import { CliReport } from "./report.js";
import {
	kababToConstantCase,
	toPascalCase,
	toTitleCase,
} from "./utils/case.js";
import { processColumnType } from "./postgres/processColumnType.js";
import { SqlDatabase } from "remult";
import { toFnAndImport } from "./utils/format.js";

type CliColumnInfo = {
	col: string;
	decorator_fn: string;
	decorator_import: string | null;
};
export function build_column({
	decorator,
	decoratorArgsValueType,
	decoratorArgsOptions,
	columnNameTweak,
	columnName,
	isNullable,
	type,
	defaultVal,
}: {
	decorator: string;
	decoratorArgsValueType: string;
	decoratorArgsOptions: string[];
	columnNameTweak: string | null;
	columnName: string;
	isNullable: "YES" | "NO";
	type: string | null;
	defaultVal: string | null;
}): CliColumnInfo {
	if (
		columnName.toLocaleLowerCase() !== columnName ||
		columnNameTweak ||
		columnName === "order"
	) {
		decoratorArgsOptions.unshift(`dbName: '"${columnName}"'`);
	}

	if (isNullable === "YES") {
		decoratorArgsOptions.push(`allowNull: true`);
	}

	const decoratorArgs = [];
	if (decoratorArgsValueType) {
		decoratorArgs.push(decoratorArgsValueType);
	}

	// by default, let's not publish a field "password"
	if (columnName.toLocaleLowerCase() === "password") {
		decoratorArgsOptions.push(`includeInApi: false`);
		decoratorArgsOptions.push(`inputType: 'password'`);
	}
	if (columnName.toLocaleLowerCase() === "email") {
		decoratorArgsOptions.push(`inputType: 'email'`);
	}

	if (decoratorArgsOptions.length > 0) {
		decoratorArgs.push(`{ ${decoratorArgsOptions.join(", ")} }`);
	}

	const { str_fn: decorator_fn, str_import: decorator_import } =
		toFnAndImport(decorator);

	let current_col = `\t${decorator_fn}(${decoratorArgs.join(", ")})\n\t${
		columnNameTweak ? columnNameTweak : columnName
	}`;

	if (isNullable === "YES") {
		current_col += "?";
	}
	if (isNullable !== "YES" && !defaultVal) {
		current_col += "!";
	}

	if (type) {
		current_col += ": ";
		current_col += type;
	}
	if (defaultVal) {
		current_col += " = " + defaultVal;
	}

	return { col: current_col, decorator_fn, decorator_import };
}

export async function getEntitiesTypescriptPostgres(
	connectionString: string,
	outputDir: string,
	tableProps: string,
	custom_decorators: Record<string, string> = {},
	// TODO: remove it when @jycouet finish with that
	tmp_jyc = false,
	schema = "public",
	exclude = [
		"pg_stat_statements",
		"pg_stat_statements_info",
		"_prisma_migrations",
	],
	include: string[] = []
) {
	const report = { noTableMatchingforeignKey: [], typeCouldBeBetter: [] };

	const provider = await createPostgresDataProvider({
		connectionString,
	});

	const tableInfo = await getTablesInfo(provider);
	const foreignKeys = await getForeignKeys(provider);

	rmSync(outputDir, { recursive: true, force: true });

	mkdirSync(outputDir, { recursive: true });
	const entities_path = `${outputDir}/entities/`;
	mkdirSync(entities_path);
	const enums_path = `${outputDir}/enums/`;
	mkdirSync(enums_path);

	const allTables = tableInfo.map((table) => {
		const tableForeignKeys = foreignKeys.filter(
			({ table_name }) => table.table_name === table_name
		);

		return new DbTable(
			table.table_name,
			table.table_schema,
			tableForeignKeys,
			tmp_jyc
		);
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
						const { entityString, enumsStrings } =
							await getEntityTypescriptPostgres(
								connectionString,
								schema,
								table,
								tableProps,
								custom_decorators,
								report
							);
						writeFileSync(
							`${entities_path}${table.className}.ts`,
							entityString
						);

						enumsStrings.forEach(({ enumName, enumString }) => {
							writeFileSync(`${enums_path}${enumName}.ts`, enumString);
						});
						tablesGenerated.push(table);
					}
				} catch (error) {
					console.error(error);
				}
			})
	);

	const sortedTables = tablesGenerated
		.slice()
		.sort((a, b) => a.className.localeCompare(b.className));

	// write "_entities.ts"
	writeFileSync(
		`${entities_path}_entities.ts`,
		`${sortedTables
			.map((e) => {
				return `import { ${e.className} } from './${e.className}'`;
			})
			.join("\n")}

export const entities = [
	${sortedTables.map((c) => c.className).join(",\n  ")}
]`
	);

	return report;
}

async function getEntityTypescriptPostgres(
	connectionString: string,
	schema: string,
	table: DbTable,
	tableProps: string,
	custom_decorators: Record<string, string>,
	report: CliReport
) {
	const provider = await createPostgresDataProvider({
		connectionString,
	});

	const enums: Record<string, string[]> = {};
	const additionnalImports: string[] = [];

	const cols = [];
	const props = [];
	props.push(tableProps);
	if (table.dbName !== table.className) {
		if (table.schema === "public" && table.dbName === "user") {
			// TODO fix dbName should be able to take a schema
			props.push(`// dbName: '${table.dbName}'`);
			props.push(`sqlExpression: 'public.${table.dbName}'`);
		} else {
			props.push(`dbName: '${table.dbName}'`);
		}
	}

	let defaultOrderBy: string | null = null;
	for (const {
		column_name: columnName,
		column_default: columnDefault,
		data_type: dataType,
		datetime_precision: datetimePrecision,
		character_maximum_length: characterMaximumLength,
		udt_name: udtName,
		is_nullable: isNullable,
	} of await getTableColumnInfo(provider, schema, table.dbName)) {
		const decoratorArgsOptions: string[] = [];
		const columnNameTweak: string | null = null;

		const {
			decorator: decorator_infered,
			defaultVal,
			type,
			decoratorArgsValueType,
		} = processColumnType({
			columnName,
			columnDefault,
			dataType,
			datetimePrecision,
			characterMaximumLength,
			udtName,
			report,
			enums,
			provider,
			table,
		});

		// const custom_decorators: Record<string, string> = {
		// 	"@Fields.string": "@KitFields.string#@kitql/remult",
		// };

		let decorator = decorator_infered;
		for (const custom in custom_decorators) {
			if (decorator === custom) {
				decorator = custom_decorators[custom] ?? "THIS_CANNOT_HAPPEN";
				break;
			}
		}

		// TODO: extract this logic from the process column
		await handleEnums(enums, dataType, provider, udtName);

		if (!defaultOrderBy && ["order", "name", "nom"].includes(columnName)) {
			defaultOrderBy = columnName;
		}

		const current_col = build_column({
			decorator,
			decoratorArgsValueType,
			decoratorArgsOptions,
			columnNameTweak,
			columnName,
			isNullable,
			type,
			defaultVal,
		});
		if (current_col.decorator_import) {
			additionnalImports.push(current_col.decorator_import);
		}

		// do we have a foreign key ?
		const foreign_key = table.foreignKeys.find(
			(f) => f.columnName === columnName
		);
		let current_col_fk: CliColumnInfo | undefined;
		if (foreign_key) {
			current_col_fk = build_column({
				decorator: "@Field",
				decoratorArgsValueType: `() => ${foreign_key.foreignClassName}`,
				decoratorArgsOptions: ["lazy: true"],
				// TODO: make the columnNameTweak generic
				columnNameTweak: columnName.replace(/Id$/, ""),
				columnName,
				isNullable: "YES",
				type: foreign_key.foreignClassName,
				defaultVal: null,
			});
			if (current_col_fk.decorator_import) {
				additionnalImports.push(current_col_fk.decorator_import);
			}
		}

		if (current_col_fk) {
			cols.push(current_col_fk.col + `\n`);
		} else {
			cols.push(current_col.col + `\n`);
		}
	}

	if (defaultOrderBy) {
		props.push(`defaultOrderBy: { ${defaultOrderBy}: 'asc' }`);
	}

	const entityString = generateEntityString(
		table,
		enums,
		props,
		cols,
		additionnalImports
	);

	const enumsStrings = generateEnumsStrings(enums);

	return { entityString, enumsStrings };
}

function addLineIfNeeded(array: string[], format: (item: string) => string) {
	if (array.length > 0) {
		return `\n${array.map(format).join("\n")}`;
	}
	return ``;
}

const handleEnums = async (
	enums: Record<string, string[]>,
	dataType: string,
	provider: SqlDatabase,
	udtName: string
) => {
	if ("USER-DEFINED" === dataType) {
		const enumDef = await getEnumDef(provider, udtName);
		enums[toPascalCase(udtName)] = enumDef.map((e) => e.enumlabel);
	}
};

const generateEntityString = (
	table: DbTable,
	enums: Record<string, string[]>,
	props: string[],
	cols: string[],
	additionnalImports: string[]
) => {
	const isContainsForeignKeys = table.foreignKeys.length > 0;

	const foreignClassNamesToImport = [
		...new Set(
			table.foreignKeys
				.filter(({ isSelfReferenced }) => !isSelfReferenced)
				.map(({ foreignClassName }) => foreignClassName)
		),
	];

	const enumsKeys = Object.keys(enums);

	return (
		`import { Entity, ${
			isContainsForeignKeys || enumsKeys.length > 0 ? "Field, " : ""
		}Fields } from 'remult'` +
		`${addLineIfNeeded([...new Set(additionnalImports)], (c) => `${c}`)}` +
		`${addLineIfNeeded(
			foreignClassNamesToImport,
			(c) => `import { ${c} } from './${c}'`
		)}` +
		`${addLineIfNeeded(
			enumsKeys,
			(c) => `import { ${c} } from '../enums/${c}'`
		)}

@Entity<${table.className}>('${table.key}', {\n\t${props.join(",\n\t")}\n})
export class ${table.className} {
${cols.join(`\n`)}}
`
	);
};

const generateEnumsStrings = (enums: Record<string, string[]>) => {
	const res: { enumName: string; enumString: string }[] = [];

	for (const enumName in enums) {
		const enumValues = enums[enumName];

		res.push({
			enumName,
			enumString: `import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class ${enumName} {
  ${enumValues
		?.map(
			(e) =>
				`static ${kababToConstantCase(
					e
				)} = new ${enumName}('${e}', '${toTitleCase(e)}')`
		)
		.join("\n  ")}

  constructor(public id: string, public caption: string) {}
}
`,
		});
	}

	return res;
};
