import { SqlDatabase } from "remult";
import { DbTable } from "../DbTable.js";
import { CliReport } from "../report.js";
import { toPascalCase } from "../utils/case.js";
import { yellow } from "kleur/colors";

interface ColumnInfo {
	columnName: string;
	columnDefault: string | null;
	dataType: string;
	datetimePrecision: number;
	characterMaximumLength: number;
	udtName: string;
}

type DataTypeProcessorFunction = (
	// i need better name
	input: ColumnInfo & {
		report: CliReport;
		table: DbTable;
	}
) => Partial<{
	type: string | null;
	decorator: string;
	defaultVal: string;
	decoratorArgsValueType: string;
}> | void;

export const processColumnType = async (
	input: ColumnInfo & {
		report: CliReport;
		enums: Record<string, string[]>;
		provider: SqlDatabase;
		table: DbTable;
	}
) => {
	const {
		characterMaximumLength,
		columnDefault,
		columnName,
		dataType,
		udtName,
		// enums,
		// provider,
		table,
	} = input;

	const dataTypeProcessors: Record<string, DataTypeProcessorFunction> = {
		decimal: intOrAutoIncrementProcessor,
		real: intOrAutoIncrementProcessor,
		int: intOrAutoIncrementProcessor,
		integer: intOrAutoIncrementProcessor,
		smallint: intOrAutoIncrementProcessor,
		tinyint: intOrAutoIncrementProcessor,

		bigint: intOrNumberProcessor,
		float: intOrNumberProcessor,
		numeric: intOrNumberProcessor,
		NUMBER: intOrNumberProcessor,
		money: intOrNumberProcessor,
		"double precision": intOrNumberProcessor,

		nchar: stringProcessor,
		nvarchar: stringProcessor,
		ntext: stringProcessor,
		NVARCHAR2: stringProcessor,
		text: stringProcessor,
		varchar: stringProcessor,
		VARCHAR2: stringProcessor,
		character: stringProcessor,
		"character varying": stringProcessor,

		CHAR: charProcessor,
		char: charProcessor,

		date: dateProcessor,
		DATE: dateProcessor,
		datetime: dateProcessor,
		datetime2: dateProcessor,
		"timestamp without time zone": dateProcessor,

		bit: booleanProcessor,
		boolean: booleanProcessor,

		ARRAY: arrayProcessor,
		"USER-DEFINED": enumProcessor,

		//  TODO

		// const enumDef = await getEnumDef(provider, udtName);

		// enums[toPascalCase(udtName)] = enumDef.map((e) => e.enumlabel);
	};
	const field = dataTypeProcessors[dataType]?.(input);

	if (!field) {
		console.log("unmanaged", {
			tableObj: JSON.stringify(table),
			columnName,
			data_type: dataType,
			character_maximum_length: characterMaximumLength,
			column_default: columnDefault,
			udt_name: udtName,
		});
	}

	return {
		decorator: field?.decorator ?? "@Fields.string",
		decoratorArgsValueType: field?.decoratorArgsValueType ?? "",
		type: field?.type ?? "string",
		defaultVal: field?.defaultVal ?? null,
	};
};

const stringProcessor: DataTypeProcessorFunction = ({ columnName }) => {
	if (columnName === "id") {
		return {
			type: "string",
			decorator: "@Fields.cuid",
		};
	}

	return {
		decorator: "@Fields.string",
		type: "string",
	};
};

const booleanProcessor: DataTypeProcessorFunction = () => {
	return {
		decorator: "@Fields.boolean",
		type: "boolean",
	};
};

const dateProcessor: DataTypeProcessorFunction = ({ columnName }) => {
	if (columnName === "createdAt" || columnName === "dateCreated") {
		return {
			decorator: "@Fields.createdAt",
			type: null, // will be inferred
			defaultVal: "new Date()",
		};
	}

	if (columnName === "updatedAt") {
		return {
			decorator: "@Fields.updatedAt",
			type: null, // will be inferred
			defaultVal: "new Date()",
		};
	}

	return {
		decorator: "@Fields.date",
		type: "Date",
	};
};

const enumProcessor: DataTypeProcessorFunction = ({
	columnDefault,
	udtName,
}) => {
	return {
		decorator: `@Field`,
		decoratorArgsValueType: `() => ${toPascalCase(udtName)}`,
		type: columnDefault === null ? toPascalCase(udtName) : null,
		defaultVal:
			columnDefault !== null
				? toPascalCase(udtName) + "." + columnDefault.split("'")[1]
				: undefined,
	};
};

const arrayProcessor: DataTypeProcessorFunction = ({
	report,
	table,
	columnName,
}) => {
	// TODO: We can probably do better
	report.typeCouldBeBetter.push(
		yellow(
			`For table ["${table.dbName}"] column ["${columnName}"] => The type is not specified.`
		)
	);

	return {
		decorator: "@Fields.json",
		type: null,
		defaultVal: "[]",
	};
};

const intOrAutoIncrementProcessor: DataTypeProcessorFunction = ({
	columnDefault,
}) => {
	return {
		type: "number",
		decorator: columnDefault?.startsWith("nextval")
			? "@Fields.autoIncrement"
			: "@Fields.integer",
	};
};

const intOrNumberProcessor: DataTypeProcessorFunction = ({
	datetimePrecision,
}) => {
	return {
		type: "number",
		decorator: datetimePrecision === 0 ? "@Fields.integer" : "@Fields.number",
	};
};

const charProcessor: DataTypeProcessorFunction = ({
	characterMaximumLength,
	columnDefault,
}) => {
	if (characterMaximumLength == 8 && columnDefault == "('00000000')") {
		return { decorator: "@Fields.dateOnly", type: "Date" };
	}
};
