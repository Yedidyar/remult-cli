import { SqlDatabase } from "remult";

// usefull for debuging
// SqlDatabase.LogToConsole = "oneLiner";

export interface TableInfo {
	table_name: string;
	table_schema: string;
}

export interface TableColumnInfo {
	column_name: string;
	column_default: string | null;
	data_type: string;
	datetime_precision: number;
	character_maximum_length: number;
	udt_name: string;
	is_nullable: "YES" | "NO";
}

export interface ForeignKey {
	table_schema: string;
	table_name: string;
	column_name: string;
	foreign_table_schema: string;
	foreign_table_name: string;
	foreign_column_name: string;
}

export interface EnumDef {
	typname: string;
	enumlabel: string;
}

export const getTablesInfo = async (
	sqlDatabase: SqlDatabase
): Promise<TableInfo[]> => {
	const command = sqlDatabase.createCommand();
	const tablesInfo = await command.execute(
		`SELECT table_name, table_schema FROM information_schema.tables;`
	);

	return tablesInfo.rows;
};

export const getTableColumnInfo = async (
	sqlDatabase: SqlDatabase,
	schema: string,
	tableName: string
): Promise<TableColumnInfo[]> => {
	const command = sqlDatabase.createCommand();
	const tablesColumnInfo = await command.execute(
		`SELECT * from INFORMATION_SCHEMA.COLUMNS
			WHERE
				table_name=${command.addParameterAndReturnSqlToken(tableName)}
				AND
				table_schema=${command.addParameterAndReturnSqlToken(schema)}
      ORDER BY ordinal_position`
	);

	return tablesColumnInfo.rows;
};

export const getForeignKeys = async (
	sqlDatabase: SqlDatabase
): Promise<ForeignKey[]> => {
	const command = sqlDatabase.createCommand();
	const foreignKeys = await command.execute(
		`SELECT
			tc.table_schema,
			tc.table_name,
			kcu.column_name,
			ccu.table_schema AS foreign_table_schema,
			ccu.table_name AS foreign_table_name,
			ccu.column_name AS foreign_column_name
		FROM
			information_schema.table_constraints AS tc
			JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
			AND tc.table_schema = kcu.table_schema
			JOIN information_schema.constraint_column_usage AS ccu
			ON ccu.constraint_name = tc.constraint_name
			AND ccu.table_schema = tc.table_schema
		WHERE tc.constraint_type = 'FOREIGN KEY';`
	);

	return foreignKeys.rows;
};

export const getEnumDef = async (
	sqlDatabase: SqlDatabase,
	udt_name: string
): Promise<EnumDef[]> => {
	const command = sqlDatabase.createCommand();
	const enumDef = await command.execute(
		`SELECT t.typname, e.enumlabel
						FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
						WHERE t.typname = '${udt_name}'
						ORDER BY t.typname, e.enumlabel;`
	);

	return enumDef.rows;
};
