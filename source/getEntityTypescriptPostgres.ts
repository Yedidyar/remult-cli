import {
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	rmdirSync,
	unlinkSync,
	writeFileSync,
} from "fs";
import { green, yellow } from "kleur/colors";
import { SqlDatabase, remult } from "remult";

const deleteFolderRecursive = (path: string) => {
	if (existsSync(path)) {
		readdirSync(path).forEach((file) => {
			const curPath = `${path}/${file}`;
			if (lstatSync(curPath).isDirectory()) {
				// Recursive call for subdirectories
				deleteFolderRecursive(curPath);
			} else {
				// Delete file
				unlinkSync(curPath);
			}
		});
		// Delete empty directory
		rmdirSync(path);
	} else {
	}
};

const toPascalCase = (str: string) => {
	return str
		.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
		.replace(/^\w/, (c) => c.toUpperCase());
};

function toCamelCase(str: string) {
	let words = toPascalCase(str).split("");
	if (words[0]) {
		words[0] = words[0].toLowerCase();
	}
	return words.join("");
}

const toTitleCase = (str: string) => {
	return str
		.toLowerCase()
		.replace(/_/g, " ")
		.replace(/\w+/g, (match) => match.charAt(0).toUpperCase() + match.slice(1));
};

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

class DbTable {
	schema: string;
	db_name: string;
	graphql_key: string;
	class_name: string;
	foreign_key: string;

	constructor(db_name: string, schema: string) {
		this.schema = schema;
		this.db_name = db_name;
		this.class_name = toPascalCase(db_name);

		this.foreign_key = toCamelCase(db_name + "Id");

		this.graphql_key = toCamelCase(this.class_name) + "s";
		if (([] as string[]).includes(this.class_name)) {
			// let's do here a real custom mapping
			// TODO: provide a custom mapping?
		} else if (this.graphql_key.endsWith("ys")) {
			this.graphql_key = this.graphql_key.slice(0, -2) + "ies";
		}
	}
}

let report: {
	noTableMatchingforeignKey: string[];
	typeCouldBeBetter: string[];
};

// TODO: everything optionnal
export async function getEntitiesTypescriptPostgres(
	// connectionString: string,
	schema = "public",
	exclude = [
		"pg_stat_statements",
		"pg_stat_statements_info",
		"_prisma_migrations",
	],
	include: string[] = [],
	withReport: "no" | "numbers" | "full" = "numbers"
) {
	report = { noTableMatchingforeignKey: [], typeCouldBeBetter: [] };
	const command = SqlDatabase.getDb(remult).createCommand();

	const result = await command.execute(
		`SELECT table_name, table_schema FROM information_schema.tables;`
	);

	deleteFolderRecursive("./src/shared");
	mkdirSync("./src/shared/");
	const entities_path = "./src/shared/entities/";
	mkdirSync(entities_path);
	const enums_path = "./src/shared/enums/";
	mkdirSync(enums_path);

	const allTables: DbTable[] = [];
	// build the list of classes first (for foreign keys link later)
	result.rows.forEach(async (c) => {
		const table = new DbTable(c.table_name, c.table_schema);
		allTables.push(table);
	});

	const tablesGenerated: DbTable[] = [];
	await Promise.all(
		allTables
			// let's generate schema by schema
			.filter((c) => c.schema === schema)
			.map(async (table) => {
				try {
					if (
						!exclude.includes(table.db_name) &&
						(include.length === 0 || include.includes(table.db_name))
					) {
						const data = await getEntityTypescriptPostgres(
							enums_path,
							allTables,
							table,
							schema
						);
						writeFileSync(`${entities_path}${table.class_name}.ts`, data);
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
			.sort((a, b) => a.class_name.localeCompare(b.class_name))
			.map((e) => {
				return `import { ${e.class_name} } from './${e.class_name}';`;
			})
			.join("\n")}

export const entities = [
  ${tablesGenerated
		.sort((a, b) => a.class_name.localeCompare(b.class_name))
		.map((c) => c.class_name)
		.join(",\n  ")}
]`
	);

	if (withReport !== "no") {
		console.log(green(` === Remult cli ===`));
		if (withReport === "full") {
			// No table matching found

			console.log(
				` - ${green(`ForeignKey, no table matching found`)}:
     ${yellow(
				report.noTableMatchingforeignKey.map((c) => `${c}`).join("\n     ")
			)}`
			);
			console.log(
				` - ${green(`Type need to be manually typed`)}:
     ${yellow(report.typeCouldBeBetter.map((c) => `${c}`).join("\n     "))}`
			);
		} else if (withReport === "numbers") {
			console.log(
				` - ${green(`ForeignKey, no table matching found`)}: ${yellow(
					report.noTableMatchingforeignKey.length
				)}`
			);
			console.log(
				` - ${green(`Type need to be manually typed`)}: ${yellow(
					report.typeCouldBeBetter.length
				)}`
			);
		}
		console.log(green(` ==================`));
	}
}

export async function getEntityTypescriptPostgres(
	enums_path: string,
	tables: DbTable[],
	table: DbTable,
	schema: string
) {
	const command = SqlDatabase.getDb(remult).createCommand();
	const commandEnum = SqlDatabase.getDb(remult).createCommand();

	let enums: Record<string, string[]> = {};
	let foreign_key_founds: Record<string, string[]> = {};

	let cols = [];
	let props = [];
	props.push("allowApiCrud: true");
	if (table.db_name !== table.class_name) {
		if (table.schema === "public" && table.db_name === "user") {
			// TODO fix dbName should be able to take a schema
			props.push(`// dbName: '${table.db_name}'`);
			props.push(`sqlExpression: 'public.${table.db_name}'`);
		} else {
			props.push(`dbName: '${table.db_name}'`);
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
	} of (
		await command.execute(
			`SELECT * from INFORMATION_SCHEMA.COLUMNS
			WHERE
				table_name=${command.addParameterAndReturnSqlToken(table.db_name)}
				AND
				table_schema=${command.addParameterAndReturnSqlToken(schema)}
      ORDER BY ordinal_position`
		)
	).rows) {
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
				break;
			case "ARRAY":
				decorator = "@Fields.json";
				type = null;
				defaultVal = "[]";

				// TODO: We can probably do better
				report.typeCouldBeBetter.push(
					`For table ["${table.db_name}"] column ["${column_name}"] => The type is not specified.`
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

				const enumDef = await commandEnum.execute(
					`SELECT t.typname, e.enumlabel
						FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
						WHERE t.typname = '${udt_name}'
						ORDER BY t.typname, e.enumlabel;`
				);

				enums[toPascalCase(udt_name)] = enumDef.rows.map((e) => e.enumlabel);
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
		const foreign_key =
			column_name.endsWith("Id") &&
			tables.find((t) => t.foreign_key === column_name);
		let current_col_fk: string | undefined;
		if (foreign_key) {
			// foreign_key_founds[foreign_key.class_name] =
			// 	foreign_key_founds[foreign_key.class_name];

			current_col_fk = build_column(
				"@Field",
				`() => ${foreign_key.class_name}`,
				["lazy: true"],
				column_name.replace(/Id$/, ""),
				column_name,
				"YES",
				foreign_key.class_name,
				null
			);
		}

		if (column_name.endsWith("Id") && !foreign_key) {
			report.noTableMatchingforeignKey.push(
				`Table ["${table.db_name}"] Column ["${column_name}"]`
			);
			// TODO: We can do probably better with this query to get the list of constraints
			// 			SELECT conrelid::regclass AS table_name,
			//        conname AS foreign_key,
			//        pg_get_constraintdef(oid)
			// FROM   pg_constraint
			// WHERE  contype = 'f'
			// AND    connamespace = 'public'::regnamespace
			// ORDER  BY conrelid::regclass::text, contype DESC;
		}

		if (current_col_fk) {
			cols.push(current_col_fk + `\n`);
		} else {
			cols.push(current_col + `\n`);
		}
		// TODO REMULT: Would be nice to have profileId & profile props. Today not working because the 2 have the same dbName and remult doesn't like it
		// cols.push(current_col + `${current_col_fk ? '' : '\n'}`)
		// if (current_col_fk) {
		// 	cols.push(current_col_fk + `\n`)
		// }
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

	let r =
		`import { Entity, Field, Fields, EntityBase } from 'remult'` +
		`${addLineIfNeeded(
			Object.keys(foreign_key_founds),
			(c) => `import { ${c} } from './${c}'`
		)}` +
		`${addLineIfNeeded(
			Object.keys(enums),
			(c) => `import { ${c} } from '../enums/${c}'`
		)}

@Entity<${table.class_name}>('${table.graphql_key}', {\n\t${props.join(
			",\n\t"
		)}\n})
export class ${table.class_name} {
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
