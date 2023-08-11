import React from 'react';
import ***REMOVED***Box, Text***REMOVED*** from 'ink';
import ***REMOVED***getEntityTypescriptPostgres***REMOVED*** from './getEntityTypescriptPostgres.js';

type Props = ***REMOVED***
	table: string;
	connectionString: string;
***REMOVED***;

export default function App(***REMOVED***connectionString, table***REMOVED***: Props) ***REMOVED***
	getEntityTypescriptPostgres(table, connectionString)
		.then(res => console.log(res))
		.catch(e => console.log(e));
	return (
		<>
			***REMOVED***/* This part will be rendered once to the terminal */***REMOVED***
			***REMOVED***/* <Static items=***REMOVED***tests***REMOVED***>
				***REMOVED***test => (
					<Box key=***REMOVED***test.id***REMOVED***>
						<Text color="green">✔ ***REMOVED***test.title***REMOVED***</Text>
					</Box>
				)***REMOVED***
			</Static> */***REMOVED***

			***REMOVED***/* This part keeps updating as state changes */***REMOVED***
			<Box marginTop=***REMOVED***1***REMOVED***>
				<Text dimColor>Completed***REMOVED******REMOVED***</Text>
				***REMOVED***/* <Text dimColor>Completed tests: ***REMOVED***tests.length***REMOVED***</Text> */***REMOVED***
			</Box>
		</>
	);
***REMOVED***
