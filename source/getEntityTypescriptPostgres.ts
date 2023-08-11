import {createPostgresDataProvider} from 'remult/postgres';
import {writeFile, mkdir} from 'fs/promises';

export function generateModels(
	connectionString: string,
	tables: string[],
	dir = '.',
) {
	mkdir(dir, {recursive: true});
	Promise.all(
		tables.map(async table => {
			const entity = await getEntityTypescriptPostgres(table, connectionString);
			writeFile(`${dir}/${table}.ts`, entity, {flag: 'w'});
		}),
	);
}

async function getEntityTypescriptPostgres(
	table: string,
	connectionString: string,
	schema = 'public',
) {
	const command = (
		await createPostgresDataProvider({
			connectionString,
		})
	).createCommand();

	let cols = '';
	let props = [];
	props.push('allowApiCrud: true');

	let first = true;
	for (const {
		column_name,
		column_default,
		data_type,
		datetime_precision,
		character_maximum_length,
	} of (
		await command.execute(
			`select * from INFORMATION_SCHEMA.COLUMNS where table_schema=${command.addParameterAndReturnSqlToken(
				schema,
			)} and table_name=${command.addParameterAndReturnSqlToken(table)}

      order by ordinal_position`,
		)
	).rows) {
		let decoratorArgs = '';

		let {decorator, defaultVal, type} = handleDataType({
			column_default,
			data_type,
			datetime_precision,
			character_maximum_length,
		});

		if (
			column_name.toLocaleLowerCase() != column_name ||
			column_name == 'order'
		)
			decoratorArgs = `{ dbName: '"${column_name}"' }`;

		cols +=
			`${!first ? '\n' : ''}\n  ` +
			decorator +
			`(${decoratorArgs})\n  ` +
			column_name;
		if (!defaultVal) {
			cols += '!';
			cols += ': ';
			cols += type;
		}
		if (defaultVal) cols += ' = ' + defaultVal;

		if (first) first = false;
	}

	let r =
		`import { Entity, Fields, EntityBase } from "remult";\n
@Entity<${toPascalCase(table)}>("${table}", { \n  ${props.join(',\n  ')} \n})
export class ${toPascalCase(table)} extends EntityBase {` +
		cols +
		'\n}'.replace('  ', '');
	return r;
}

interface Field {
	decorator: string;
	defaultVal: string;
	type: string;
}

function handleDataType({
	column_default,
	data_type,
	datetime_precision,
	character_maximum_length,
}: {
	column_default: string;
	data_type: string;
	datetime_precision: number;
	character_maximum_length: number;
}) {
	const res: Field = {
		decorator: '@Fields.string',
		defaultVal: "''",
		type: '',
	};
	switch (data_type) {
		case 'decimal':
		case 'real':
		case 'int':
		case 'smallint':
		case 'tinyint':
		case 'bigint':
		case 'float':
		case 'numeric':
		case 'NUMBER':
		case 'money':
			if (datetime_precision === 0) res.decorator = '@Fields.integer';
			else res.decorator = '@Fields.number';
			res.defaultVal = '0';
			break;
		case 'nchar':
		case 'nvarchar':
		case 'ntext':
		case 'NVARCHAR2':
		case 'text':
		case 'varchar':
		case 'VARCHAR2':
			break;
		case 'char':
		case 'CHAR':
			if (character_maximum_length == 8 && column_default == "('00000000')") {
				res.decorator = '@Fields.dateOnly';
				res.type = 'Date';
				res.defaultVal = 'new Date()';
			}
			break;
		case 'DATE':
		case 'datetime':
		case 'datetime2':
		case 'timestamp without time zone':
			res.decorator = '@Fields.date';
			res.type = 'Date';
			res.defaultVal = 'new Date()';
			break;
		case 'bit':
			res.decorator = '@Fields.boolean';
			break;
		default:
			break;
	}

	return res;
}

function toPascalCase(string: string) {
	return `${string}`
		.toLowerCase()
		.replace(new RegExp(/[-_]+/, 'g'), ' ')
		.replace(new RegExp(/[^\w\s]/, 'g'), '')
		.replace(
			new RegExp(/\s+(.)(\w*)/, 'g'),
			(_$1, $2, $3) => `${$2.toUpperCase() + $3}`,
		)
		.replace(new RegExp(/\w/), s => s.toUpperCase());
}
