import { mkdirSync, rmSync, writeFileSync } from "fs";
import { createPostgresDataProvider } from "remult/postgres";
import { DbTable, DbTableForeignKey } from "./DbTable.js";
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
export function buildColumn({
	decorator,
	decoratorArgsValueType,
	columnNameTweak,
	columnName,
	isNullable,
	type,
	defaultVal,
	decoratorArgsOptions = [],
}: {
	decorator: string;
	decoratorArgsValueType: string;
	decoratorArgsOptions?: string[];
	columnNameTweak?: string;
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

	// let's add the type only if we have it and if we don't have a default value
	if (!defaultVal && type) {
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
	customDecorators: Record<string, string> = {},
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
								customDecorators,
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
	customDecorators: Record<string, string>,
	report: CliReport
) {
	const provider = await createPostgresDataProvider({
		connectionString,
	});

	const enums: Record<string, string[]> = {};
	const additionnalImports: string[] = [];

	const cols: string[] = [];
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
		const {
			decorator: decoratorInfered,
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

		const decorator = customDecorators[decoratorInfered] ?? decoratorInfered;

		// TODO: extract this logic from the process column
		await handleEnums(enums, dataType, provider, udtName);

		if (
			!defaultOrderBy &&
			["order", "name", "nom", "username"].includes(columnName)
		) {
			defaultOrderBy = columnName;
		}

		const foreignKey = table.foreignKeys.find(
			(f) => f.columnName === columnName
		);

		if (foreignKey) {
			handleForeignKeyCol(foreignKey, columnName, additionnalImports, cols);
			continue;
		}

		const currentCol = buildColumn({
			decorator,
			decoratorArgsValueType,
			columnName,
			isNullable,
			type,
			defaultVal,
		});
		if (currentCol.decorator_import) {
			additionnalImports.push(currentCol.decorator_import);
		}
		cols.push(currentCol.col + `\n`);
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

const handleForeignKeyCol = (
	foreignKey: DbTableForeignKey,
	columnName: string,
	additionnalImports: string[],
	cols: string[]
) => {
	const currentColFk = buildColumn({
		decorator: "@Field",
		decoratorArgsValueType: `() => ${foreignKey.foreignClassName}`,
		decoratorArgsOptions: ["lazy: true"],
		// TODO: make the columnNameTweak generic
		columnNameTweak: columnName.replace(/Id$/, ""),
		columnName,
		isNullable: "YES",
		type: foreignKey.foreignClassName,
		defaultVal: null,
	});

	if (currentColFk.decorator_import) {
		additionnalImports.push(currentColFk.decorator_import);
	}

	if (currentColFk) {
		cols.push(currentColFk.col + `\n`);
	}
};

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
		`${addLineIfNeeded([...new Set(additionnalImports)], (c) => c)}` +
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
