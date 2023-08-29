# remult-cli

remult-cli is a command-line tool for generating Remult entities from a PostgreSQL database. It is easy to use, versatile, and customizable.

## Usage

```
npx remult-cli --help

	Options:
	--help              Show help                                        [boolean]
	--version           Show version number                              [boolean]
	--connectionString  Your PostgreSQL database connection string. Only
						PostgreSQL databases are supported.    [string] [required]

	Examples:
	npx remult-cli --connectionString postgres://user:pass@host:port/db-name
```

## Development

```
git clone https://github.com/Yedidyar/remult-cli.git

pnpm i -g

pnpm run dev

remult <your-command>
```

## Features

Easy and simple to use.

## Suggestions for improvement

- Add support for other databases, such as MySQL and Oracle.

## License

remult-cli is licensed under the MIT License.
