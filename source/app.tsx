import React, ***REMOVED***useEffect, useState***REMOVED*** from 'react';
import ***REMOVED***Box, Static, Text***REMOVED*** from 'ink';

// type Props = ***REMOVED******REMOVED***;

export default function App() ***REMOVED***
	const [tests, setTests] = useState<***REMOVED***id: number; title: string***REMOVED***[]>([]);

	useEffect(() => ***REMOVED***
		let completedTests = 0;
		let timer: NodeJS.Timeout;

		const run = () => ***REMOVED***
			// Fake 10 completed tests
			if (completedTests++ < 10) ***REMOVED***
				setTests(previousTests => [
					...previousTests,
					***REMOVED***
						id: previousTests.length,
						title: `Test #$***REMOVED***previousTests.length + 1***REMOVED***`,
			***REMOVED***,
			***REMOVED***);

				timer = setTimeout(run, 100);
	***REMOVED***
***REMOVED***;

		run();

		return () => ***REMOVED***
			clearTimeout(timer);
***REMOVED***;
	***REMOVED***, []);

	return (
		<>
			***REMOVED***/* This part will be rendered once to the terminal */***REMOVED***
			<Static items=***REMOVED***tests***REMOVED***>
				***REMOVED***test => (
					<Box key=***REMOVED***test.id***REMOVED***>
						<Text color="green">✔ ***REMOVED***test.title***REMOVED***</Text>
					</Box>
				)***REMOVED***
			</Static>

			***REMOVED***/* This part keeps updating as state changes */***REMOVED***
			<Box marginTop=***REMOVED***1***REMOVED***>
				<Text dimColor>Completed tests: ***REMOVED***tests.length***REMOVED***</Text>
			</Box>
		</>
	);
***REMOVED***
