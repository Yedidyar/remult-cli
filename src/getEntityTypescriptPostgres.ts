import { mkdirSync, rmSync, writeFileSync } from "fs";
import { DbTable, DbTableForeignKey } from "./DbTable.js";
import {
	getEnumDef,
	getForeignKeys,
	getTableColumnInfo,
	getTablesInfo,
	getUniqueInfo,
} from "./postgres/commands.js";
import { CliReport } from "./report.js";
import {
	kababToConstantCase,
	toCamelCase,
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
	decoratorArgsOptions = [],
	columnNameTweak,
	columnName,
	isNullable,
	type,
	defaultVal,
	foreignField,
}: {
	decorator: string;
	decoratorArgsValueType: string;
	decoratorArgsOptions?: string[];
	columnNameTweak?: string;
	columnName: string;
	isNullable: "YES" | "NO";
	type: string | null;
	defaultVal: string | null;
	foreignField?: string | null;
}): CliColumnInfo {
	if (foreignField) {
		if (foreignField !== "NO_NEED_TO_SPECIFY_FIELD") {
			decoratorArgsOptions.unshift(`field: '${foreignField}'`);
		}
	} else {
		if (
			columnName.toLocaleLowerCase() !== columnName ||
			columnNameTweak ||
			columnName === "order" ||
			columnName === "from"
		) {
			decoratorArgsOptions.unshift(`dbName: '"${columnName}"'`);
		}
	}

	if (isNullable === "YES" && !foreignField) {
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
	provider: SqlDatabase,
	outputDir: string,
	tableProps: string,
	orderBy?: (string | number)[],
	customDecorators: Record<string, string> = {},
	withEnums: boolean = true,
	schemas: (string | number)[] = [],
	exclude: (string | number)[] = [],
	include: (string | number)[] = [],
) {
	const report: CliReport = { typeCouldBeBetter: [], sAdded: [] };

	const tableInfo = await getTablesInfo(provider);

	if (tableInfo.length === 0) {
		throw new Error("No table found in the database");
	}

	const foreignKeys = await getForeignKeys(provider);

	const entities_path = `${outputDir}/entities/`;
	const enums_path = `${outputDir}/enums/`;

	if (withEnums) {
		rmSync(outputDir, { recursive: true, force: true });
		mkdirSync(outputDir, { recursive: true });
		mkdirSync(entities_path);
		mkdirSync(enums_path);
	} else {
		rmSync(entities_path, { recursive: true, force: true });
		mkdirSync(outputDir, { recursive: true });
		mkdirSync(entities_path);
	}

	const allTables = tableInfo.map((table) => {
		const tableForeignKeys = foreignKeys.filter(
			({ table_name }) => table.table_name === table_name,
		);

		return new DbTable(table.table_name, table.table_schema, tableForeignKeys);
	});

	const getEntities: {
		table: DbTable;
		enums: Record<string, string[]>;
		props: string[];
		cols: string[];
		additionnalImports: string[];
		usesValidators: boolean;
		toManys: {
			addOn: string;
			ref: string;
			refField: string;
			columnName: string;
		}[];
	}[] = [];
	await Promise.all(
		allTables
			// let's generate schema by schema
			.filter((c) =>
				schemas.length === 1 && schemas[0] === "*"
					? true
					: schemas.includes(c.schema),
			)
			.map(async (table) => {
				try {
					if (
						!exclude.includes(table.dbName) &&
						(include.length === 0 || include.includes(table.dbName))
					) {
						const str = table.checkNamingConvention();
						if (str) {
							report.sAdded.push(str);
						}

						getEntities.push(
							await getEntityTypescriptPostgres(
								allTables,
								provider,
								table.schema,
								table,
								tableProps,
								customDecorators,
								report,
								orderBy,
							),
						);
					}
				} catch (error) {
					console.error(error);
				}
			}),
	);

	const allToManys = getEntities.flatMap((e) => e.toManys);

	const enums: string[] = [];
	getEntities.forEach((ent) => {
		const entitiesImports: string[] = [];
		const additionnalImports = [];

		const toManys = allToManys
			.filter((tm) => tm.addOn === ent.table.dbName)
			.sort((a, b) => (b.columnName > a.columnName ? -1 : 1))
			.map((tm) => {
				const number_of_ref = allToManys.filter(
					(c) => c.addOn === ent.table.dbName && c.ref === tm.ref,
				).length;

				const currentCol = buildColumn({
					decorator: "@Relations.toMany#remult",
					decoratorArgsValueType: `() => ${tm.ref}`,
					isNullable: "YES",
					defaultVal: null,
					type: `${tm.ref}[]`,
					columnName: tm.columnName,
					foreignField:
						number_of_ref === 1 ? "NO_NEED_TO_SPECIFY_FIELD" : tm.refField,
				});

				entitiesImports.push(tm.ref);
				if (currentCol.decorator_import) {
					additionnalImports.push(currentCol.decorator_import);
				}

				return currentCol.col + "\n";
			});

		const cols = ent.cols;
		if (toManys.length > 0) {
			cols.push("  // Relations toMany", ...toManys);
		}
		additionnalImports.push(...ent.additionnalImports);

		const entityString = generateEntityString(
			allTables,
			ent.table,
			ent.enums,
			ent.props,
			cols,
			additionnalImports,
			entitiesImports,
			ent.usesValidators,
		);

		const enumsStrings = generateEnumsStrings(ent.enums);

		writeFileSync(`${entities_path}${ent.table.className}.ts`, entityString);

		if (withEnums) {
			enumsStrings.forEach(({ enumName, enumString }) => {
				enums.push(enumName);
				writeFileSync(`${enums_path}${enumName}.ts`, enumString);
			});
		}
	});

	const sortedTables = getEntities
		.map((e) => e.table)
		.slice()
		.sort((a, b) => a.className.localeCompare(b.className));

	// write entities "index.ts"
	writeFileSync(
		`${entities_path}index.ts`,
		`${sortedTables
			.map((e) => {
				return `import { ${e.className} } from './${e.className}'`;
			})
			.join("\n")}

export const entities = [
	${sortedTables.map((c) => c.className).join(",\n  ")}
]

export {
	${sortedTables.map((c) => c.className).join(",\n  ")}
}`,
	);

	if (enums.length > 0) {
		const sortedEnums = [
			...new Set(enums.slice().sort((a, b) => a.localeCompare(b))),
		];
		// write enums "index.ts"
		writeFileSync(
			`${enums_path}index.ts`,
			`${sortedEnums
				.map((e) => {
					return `import { ${e} } from './${e}'`;
				})
				.join("\n")}
		
export {
  ${sortedEnums.map((c) => c).join(",\n  ")}
}`,
		);
	}

	return report;
}

async function getEntityTypescriptPostgres(
	allTables: DbTable[],
	provider: SqlDatabase,
	schema: string,
	table: DbTable,
	tableProps: string,
	customDecorators: Record<string, string>,
	report: CliReport,
	orderBy?: (string | number)[],
) {
	const enums: Record<string, string[]> = {};
	const additionnalImports: string[] = [];

	const cols: string[] = [];
	const props = [];
	const toManys = [];
	props.push(tableProps);
	if (table.dbName !== table.className) {
		if (table.schema === "public" && table.dbName === "user") {
			// user is a reserved keyword, we need to speak about public.user
			props.push(`dbName: 'public.${table.dbName}'`);
		} else if (table.schema === "public") {
			if (table.dbName !== table.key) {
				props.push(`dbName: '${table.dbName}'`);
			}
		} else {
			props.push(`dbName: '${table.schema}.${table.dbName}'`);
		}
	}
	let usesValidators = false;
	let defaultOrderBy: string | null = null;
	const columnWithId: string[] = [];
	const uniqueInfo = await getUniqueInfo(provider, schema);
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
			decoratorArgsOptions,
			enumAdditionalName,
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
		if (columnName.toLowerCase().includes("id")) {
			columnWithId.push(columnName);
		}
		if (
			uniqueInfo.find(
				(u) =>
					u.table_schema === schema &&
					u.table_name === table.dbName &&
					u.column_name === columnName,
			)
		) {
			usesValidators = true;
			decoratorArgsOptions.push("validate: [Validators.uniqueOnBackend]");
		}

		const decorator = customDecorators[decoratorInfered] ?? decoratorInfered;

		// TODO: extract this logic from the process column
		if (enumAdditionalName) {
			await handleEnums(enums, "USER-DEFINED", provider, enumAdditionalName);
		}
		await handleEnums(enums, dataType, provider, udtName);

		if (!defaultOrderBy && orderBy?.includes(columnName)) {
			defaultOrderBy = columnName;
		}

		const currentCol = buildColumn({
			decorator,
			decoratorArgsValueType,
			decoratorArgsOptions,
			columnName,
			isNullable,
			type,
			defaultVal,
		});
		if (currentCol.decorator_import) {
			additionnalImports.push(currentCol.decorator_import);
		}
		cols.push(currentCol.col + `\n`);

		const foreignKey = table.foreignKeys.find(
			(f) => f.columnName === columnName,
		);
		if (foreignKey) {
			const { columnNameTweak } = handleForeignKeyCol(
				allTables,
				foreignKey,
				columnName,
				additionnalImports,
				cols,
				isNullable,
			);

			const toMany = {
				addOn: foreignKey.foreignDbName,
				ref: table.className,
				refField: columnName,
				columnName:
					columnNameTweak === toCamelCase(foreignKey.foreignDbName)
						? `${table.key}`
						: `${table.key}Of${columnNameTweak}`,
			};
			toManys.push(toMany);
		}
	}

	if (defaultOrderBy) {
		props.push(`defaultOrderBy: { ${defaultOrderBy}: 'asc' }`);
	}

	if (!columnWithId.includes("id")) {
		props.push(`id: { ${columnWithId.map((c) => `${c}: true`).join(", ")} }`);
	}

	return {
		table,
		enums,
		props,
		cols,
		additionnalImports,
		usesValidators,
		toManys,
	} as const;
}

function addLineIfNeeded(array: string[], format?: (item: string) => string) {
	if (array.length === 0) {
		return ``;
	}

	if (!format) {
		return `\n${array.join("\n")}`;
	}

	return `\n${array.map(format).join("\n")}`;
}

const handleForeignKeyCol = (
	allTables: DbTable[],
	foreignKey: DbTableForeignKey,
	columnName: string,
	additionnalImports: string[],
	cols: string[],
	isNullable: "YES" | "NO",
) => {
	const columnNameTweak = columnName.replace(/_id$/, "").replace(/Id$/, "");

	const f = allTables.find((t) => t.dbName === foreignKey.foreignDbName)!;

	const currentColFk = buildColumn({
		decorator: "@Relations.toOne#remult",
		decoratorArgsValueType: `() => ${f.className}`,
		columnNameTweak,
		columnName,
		isNullable,
		type: f.className,
		defaultVal: null,
		foreignField: columnName,
	});

	if (currentColFk.decorator_import) {
		additionnalImports.push(currentColFk.decorator_import);
	}

	if (currentColFk) {
		cols.push(currentColFk.col + `\n`);
	}

	return { columnNameTweak };
};

const handleEnums = async (
	enums: Record<string, string[]>,
	dataType: string,
	provider: SqlDatabase,
	udtName: string,
) => {
	if ("USER-DEFINED" === dataType) {
		const enumDef = await getEnumDef(provider, udtName);
		enums[toPascalCase(udtName)] = enumDef.map((e) => e.enumlabel);
	}
};

const generateEntityString = (
	allTables: DbTable[],
	table: DbTable,
	enums: Record<string, string[]>,
	props: string[],
	cols: string[],
	additionnalImports: string[],
	entitiesImports: string[],
	usesValidators: boolean,
) => {
	const isContainsForeignKeys = table.foreignKeys.length > 0;

	const foreignClassNamesToImport = [
		...table.foreignKeys.map(
			({ foreignDbName }) =>
				allTables.find((t) => t.dbName === foreignDbName)!.className,
		),
		...entitiesImports,
	].filter((c) => c !== table.className);

	const enumsKeys = Object.keys(enums);

	return (
		`import { Entity, ${
			isContainsForeignKeys || enumsKeys.length > 0 ? "Field, " : ""
		}Fields${usesValidators ? ", Validators" : ""} } from 'remult'` +
		`${addLineIfNeeded([...new Set(additionnalImports)])}` +
		`${addLineIfNeeded(
			[...new Set(foreignClassNamesToImport)],
			(c) => `import { ${c} } from '.'`,
		)}` +
		`${addLineIfNeeded(enumsKeys, (c) => `import { ${c} } from '../enums'`)}

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
					e,
				)} = new ${enumName}('${e}', '${toTitleCase(e)}')`,
		)
		.join("\n  ")}

  constructor(public id: string, public caption: string) {}
}
`,
		});
	}

	return res;
};
