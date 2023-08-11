import React, ***REMOVED***useEffect***REMOVED*** from 'react';
import ***REMOVED***Box, Text***REMOVED*** from 'ink';
import ***REMOVED***generateModels***REMOVED*** from './getEntityTypescriptPostgres.js';

type Props = ***REMOVED***
	tables: string[];
	connectionString: string;
***REMOVED***;

export default function App(***REMOVED***connectionString, tables***REMOVED***: Props) ***REMOVED***
	useEffect(() => ***REMOVED***
		generateModels(connectionString, tables);
	***REMOVED***, []);

	return (
		<>
			<Box marginTop=***REMOVED***1***REMOVED***>
				<Text dimColor>Completed</Text>
			</Box>
		</>
	);
***REMOVED***
