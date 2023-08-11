import ***REMOVED***createPostgresDataProvider***REMOVED*** from 'remult/postgres';

export async function getEntityTypescriptPostgres(
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

	let first: string = undefined!;
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
		if (!first) first = column_name;
		cols += '\n\n  ' + decorator + `($***REMOVED***decoratorArgs***REMOVED***)\n  ` + column_name;
		if (!defaultVal) ***REMOVED***
			cols += '!';
			cols += ': ';
			cols += type;
***REMOVED***
		if (defaultVal) cols += ' = ' + defaultVal;
	***REMOVED***
	// props.push(`defaultOrderBy: ***REMOVED*** $***REMOVED***first***REMOVED***: "asc" ***REMOVED***`)
	let r =
		`import ***REMOVED*** Entity, Fields, EntityBase ***REMOVED*** from "remult";
@Entity<$***REMOVED***table***REMOVED***>("$***REMOVED***table***REMOVED***", ***REMOVED*** \n  $***REMOVED***props.join(',\n  ')***REMOVED*** \n***REMOVED***)
export class $***REMOVED***table***REMOVED*** extends EntityBase ***REMOVED***` +
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
	***REMOVED***
			break;
		case 'DATE':
		case 'datetime':
		case 'datetime2':
		case 'timestamp without time zone':
			res.decorator = '@Fields.date';
			res.type = 'Date';
			break;
		case 'bit':
			res.decorator = '@Fields.boolean';
			break;
		default:
			break;
	***REMOVED***

	return res;
***REMOVED***
