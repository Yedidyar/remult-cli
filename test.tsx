import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import ***REMOVED***render***REMOVED*** from 'ink-testing-library';
import App from './source/app.js';

test('greet unknown user', t => ***REMOVED***
	const ***REMOVED***lastFrame***REMOVED*** = render(<App name=***REMOVED***undefined***REMOVED*** />);

	t.is(lastFrame(), `Hello, $***REMOVED***chalk.green('Stranger')***REMOVED***`);
***REMOVED***);

test('greet user with a name', t => ***REMOVED***
	const ***REMOVED***lastFrame***REMOVED*** = render(<App name="Jane" />);

	t.is(lastFrame(), `Hello, $***REMOVED***chalk.green('Jane')***REMOVED***`);
***REMOVED***);
