import ***REMOVED***createPostgresDataProvider***REMOVED*** from 'remult/postgres';
import ***REMOVED***writeFile, mkdir***REMOVED*** from 'fs/promises';

export function generateModels(
	connectionString: string,
	tables: string[],
	dir = '.',
) ***REMOVED***
	mkdir(dir, ***REMOVED***recursive: true***REMOVED***);
	Promise.all(
		tables.map(async table => ***REMOVED***
			const entity = await getEntityTypescriptPostgres(table, connectionString);
			writeFile(`$***REMOVED***dir***REMOVED***/$***REMOVED***table***REMOVED***.ts`, entity, ***REMOVED***flag: 'w'***REMOVED***);
***REMOVED***),
	);
***REMOVED***

async function getEntityTypescriptPostgres(
	table: string,
	connectionString: string,
	schema = 'public',
) ***REMOVED***
	const command = (
		await createPostgresDataProvider(***REMOVED***
			connectionString,
***REMOVED***)
	).createCommand();

	let cols = '';
	let props = [];
	props.push('allowApiCrud: true');

	let first = true;
	for (const ***REMOVED***
		column_name,
		column_default,
		data_type,
		datetime_precision,
		character_maximum_length,
	***REMOVED*** of (
		await command.execute(
			`select * from INFORMATION_SCHEMA.COLUMNS where table_schema=$***REMOVED***command.addParameterAndReturnSqlToken(
				schema,
			)***REMOVED*** and table_name=$***REMOVED***command.addParameterAndReturnSqlToken(table)***REMOVED***

      order by ordinal_position`,
		)
	).rows) ***REMOVED***
		let decoratorArgs = '';

		let ***REMOVED***decorator, defaultVal, type***REMOVED*** = handleDataType(***REMOVED***
			column_default,
			data_type,
			datetime_precision,
			character_maximum_length,
***REMOVED***);

		if (
			column_name.toLocaleLowerCase() != column_name ||
			column_name == 'order'
		)
			decoratorArgs = `***REMOVED*** dbName: '"$***REMOVED***column_name***REMOVED***"' ***REMOVED***`;

		cols +=
			`$***REMOVED***!first ? '\n' : ''***REMOVED***\n  ` +
			decorator +
			`($***REMOVED***decoratorArgs***REMOVED***)\n  ` +
			column_name;
		if (!defaultVal) ***REMOVED***
			cols += '!';
			cols += ': ';
			cols += type;
***REMOVED***
		if (defaultVal) cols += ' = ' + defaultVal;

		if (first) first = false;
	***REMOVED***

	let r =
		`import ***REMOVED*** Entity, Fields, EntityBase ***REMOVED*** from "remult";\n
@Entity<$***REMOVED***toPascalCase(table)***REMOVED***>("$***REMOVED***table***REMOVED***", ***REMOVED*** \n  $***REMOVED***props.join(',\n  ')***REMOVED*** \n***REMOVED***)
export class $***REMOVED***toPascalCase(table)***REMOVED*** extends EntityBase ***REMOVED***` +
		cols +
		'\n***REMOVED***'.replace('  ', '');
	return r;
***REMOVED***

interface Field ***REMOVED***
	decorator: string;
	defaultVal: string;
	type: string;
***REMOVED***

function handleDataType(***REMOVED***
	column_default,
	data_type,
	datetime_precision,
	character_maximum_length,
***REMOVED***: ***REMOVED***
	column_default: string;
	data_type: string;
	datetime_precision: number;
	character_maximum_length: number;
***REMOVED***) ***REMOVED***
	const res: Field = ***REMOVED***
		decorator: '@Fields.string',
		defaultVal: "''",
		type: '',
	***REMOVED***;
	switch (data_type) ***REMOVED***
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
			if (character_maximum_length == 8 && column_default == "('00000000')") ***REMOVED***
				res.decorator = '@Fields.dateOnly';
				res.type = 'Date';
				res.defaultVal = 'new Date()';
	***REMOVED***
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
	***REMOVED***

	return res;
***REMOVED***

function toPascalCase(string: string) ***REMOVED***
	return `$***REMOVED***string***REMOVED***`
		.toLowerCase()
		.replace(new RegExp(/[-_]+/, 'g'), ' ')
		.replace(new RegExp(/[^\w\s]/, 'g'), '')
		.replace(
			new RegExp(/\s+(.)(\w*)/, 'g'),
			(_$1, $2, $3) => `$***REMOVED***$2.toUpperCase() + $3***REMOVED***`,
		)
		.replace(new RegExp(/\w/), s => s.toUpperCase());
***REMOVED***
