import { SqlCommand, SqlDatabase } from "remult";
import { EntitySchema, Field } from "./entity-schema.js";

interface Column {
	table_name: string;
	column_name: string;
	is_nullable: "YES" | "NO";
	column_default: string;
	data_type: string;
}

type EntitySchemas = Record<string, EntitySchema>;

export default async function postgresIntrospection(
	sqlDatabase: SqlDatabase,
	schema: string
): Promise<EntitySchemas> {
	const command = sqlDatabase.createCommand();
	const columns = await getColumns(command, schema);
	console.log(columns);

	columns.reduce<EntitySchemas>((prev, column) => {
		if (prev[column.table_name]) {
			// const allowNull = column.is_nullable === 'YES';
			// const field = handleDataType(column.data_type);

			return prev;
		}
		return prev;
	}, {});

	return {};
}
// @ts-ignore
function handleColumn(column: Column): Field {
	const res: Field = {
		name: column.column_name,
		allowNull: column.is_nullable === "YES",
		type: "string",
	};
	switch (column.data_type) {
		case "integer":
			res.type = "number";
			return res;
		case "decimal":
		case "real":
		case "smallint":
		case "tinyint":
		case "bigint":
		case "float":
		case "numeric":
		case "money":
		case "text":
		case "varchar":
		case "nvarchar":
		case "ntext":
		case "NVARCHAR2":
		case "VARCHAR2":
		case "char":
		case "CHAR":
		case "date":
		case "datetime":
		case "datetime2":
		case "timestamp without time zone":
		case "bit":
		default:
			// Handle unsupported data types or throw an error
			throw new Error(`Unsupported data type: ${column.data_type}`);
	}
}

async function getColumns(
	command: SqlCommand,
	schema: string
): Promise<Column[]> {
	const tables = await command.execute(
		`SELECT TABLE_NAME,
			COLUMN_NAME,
			IS_NULLABLE,
			COLUMN_DEFAULT,
			DATA_TYPE,
			ORDINAL_POSITION
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = ${command.addParameterAndReturnSqlToken(schema)}
		ORDER BY ORDINAL_POSITION`
	);

	return tables.rows;
}
