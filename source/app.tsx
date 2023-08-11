import React, {useEffect} from 'react';
import {Box, Text} from 'ink';
import {generateModels} from './getEntityTypescriptPostgres.js';

type Props = {
	tables: string[];
	connectionString: string;
	dir?: string;
};

export default function App({connectionString, tables, dir}: Props) {
	useEffect(() => {
		generateModels(connectionString, tables, dir);
	}, []);

	return (
		<>
			<Box marginTop={1}>
				<Text dimColor>Completed</Text>
			</Box>
		</>
	);
}
