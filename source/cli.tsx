#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ remult

	Options
		--connectionString  Your connectionString only postgres is supported
		--tables  you can pass multiple
		--dir the directory that the entities will

	Examples
	  $ remult --connectionString=postgres://user:pass@host:port/db-name --tables=users --tables=permissions
`,
	{
		importMeta: import.meta,
		flags: {
			connectionString: {
				type: 'string',
				isRequired: true,
			},
			tables: {
				type: 'string',
				isRequired: true,
				isMultiple: true,
			},
			dir: {
				type: 'string',
			},
		},
	},
);

render(
	<App
		connectionString={cli.flags.connectionString}
		tables={cli.flags.tables}
		dir={cli.flags.dir}
	/>,
);
