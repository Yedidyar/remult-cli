import { DbTable } from "./DbTable.js";
import { CliReport } from "../report.js";

export interface IDatabase {
	init(connectionString: string): Promise<void>;
	getTablesInfo(): Promise<TableInfo[]>;
	getTableColumnInfo(
		schema: string,
		tableName: string,
	): Promise<TableColumnInfo[]>;
	getUniqueInfo(schema: string): Promise<
		{
			table_schema: string;
			table_name: string;
			column_name: string;
		}[]
	>;
	getForeignKeys(): Promise<ForeignKey[]>;
	getEnumDef(udt_name: string): Promise<EnumDef[]>;
}

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

export interface ColumnInfo {
	columnName: string;
	columnDefault: string | null;
	dataType: string;
	datetimePrecision: number;
	characterMaximumLength: number;
	udtName: string;
}

export type DataTypeProcessorFunction = (
	input: ColumnInfo & {
		report: CliReport;
		table: DbTable;
	},
) => Partial<{
	type: string | null;
	decorator: string;
	defaultVal: string;
	decoratorArgsValueType: string;
	decoratorArgsOptions: string[];
	enumAdditionalName: string;
}> | void;
