import { SqlDatabase } from "remult";
import { IDatabase, TableInfo } from "./types.js";

export class DbPostgres implements IDatabase {
	constructor(private sqlDatabase: SqlDatabase) {}

	async getTablesInfo() {
		const command = this.sqlDatabase.createCommand();
		const tablesInfo = await command.execute(
			`SELECT table_name, table_schema FROM information_schema.tables;`,
		);
		return tablesInfo.rows;
	}

	async getTableColumnInfo(schema: string, tableName: string) {
		const command = this.sqlDatabase.createCommand();
		const tablesColumnInfo = await command.execute(
			`SELECT * from INFORMATION_SCHEMA.COLUMNS
				WHERE
					table_name=${command.addParameterAndReturnSqlToken(tableName)}
					AND
					table_schema=${command.addParameterAndReturnSqlToken(schema)}
				ORDER BY ordinal_position`,
		);

		return tablesColumnInfo.rows;
	}

	async getUniqueInfo(schema: string) {
		const command = this.sqlDatabase.createCommand();
		const tablesColumnInfo = await command.execute(
			`SELECT table_schema, table_name, column_name
			FROM information_schema.table_constraints AS c
				 JOIN information_schema.constraint_column_usage AS cc
						USING (table_schema, table_name, constraint_name)
			WHERE c.constraint_type = 'UNIQUE' ` +
				`AND table_schema = ${command.addParameterAndReturnSqlToken(schema)};`,
		);

		return tablesColumnInfo.rows.map((c) => {
			return {
				table_schema: c.table_schema,
				table_name: c.table_name,
				column_name: c.column_name,
			};
		});
	}

	async getForeignKeys() {
		const command = this.sqlDatabase.createCommand();
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
			WHERE tc.constraint_type = 'FOREIGN KEY';`,
		);

		return foreignKeys.rows;
	}

	async getEnumDef(udt_name: string) {
		const command = this.sqlDatabase.createCommand();
		const enumDef = await command.execute(
			`SELECT t.typname, e.enumlabel
							FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
							WHERE t.typname = '${udt_name}'
							ORDER BY t.typname, e.enumlabel;`,
		);

		return enumDef.rows;
	}
}
