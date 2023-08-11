import ***REMOVED***SqlDatabase, remult***REMOVED*** from 'remult';

export async function getEntityTypescriptPostgres(
	table: string,
	schema = 'public',
) ***REMOVED***
	const command = SqlDatabase.getDb(remult).createCommand();

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
		let decorator = '@Fields.string';
		let decoratorArgs = '';

		let type = '';
		let defaultVal = "''";
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
				if (datetime_precision === 0) decorator = '@Fields.integer';
				else decorator = '@Fields.number';
				defaultVal = '0';
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
				console.log(***REMOVED***
					character_maximum_length,
					column_default,
					data_type,
					column_name,
		***REMOVED***);
				if (character_maximum_length == 8 && column_default == "('00000000')") ***REMOVED***
					decorator = '@Fields.dateOnly';
					type = 'Date';
		***REMOVED***
				break;
			case 'DATE':
			case 'datetime':
			case 'datetime2':
			case 'timestamp without time zone':
				decorator = '@Fields.date';
				type = 'Date';
				break;
			case 'bit':
				decorator = '@Fields.boolean';
				break;
			default:
				console.log(data_type);
				break;
***REMOVED***

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
