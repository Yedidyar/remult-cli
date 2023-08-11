#!/usr/bin/env node
import React from 'react';
import ***REMOVED***render***REMOVED*** from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ cli

	Options
		--connectionString  Your connectionString
		--table  Your table

	Examples
	  $ cli --connectionString=postgres://user:pass@host:port/db-name --table=users
`,
	***REMOVED***
		importMeta: import.meta,
		flags: ***REMOVED***
			connectionString: ***REMOVED***
				type: 'string',
				isRequired: true,
	***REMOVED***,
			tables: ***REMOVED***
				type: 'string',
				isRequired: true,
				isMultiple: true,
	***REMOVED***,
***REMOVED***,
	***REMOVED***,
);

render(
	<App connectionString=***REMOVED***cli.flags.connectionString***REMOVED*** tables=***REMOVED***cli.flags.tables***REMOVED*** />,
);
