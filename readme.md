# remult-cli

remult-cli is a command-line tool for generating Remult entities from a PostgreSQL database (inspired by `prisma db pull`).

## Usage

1/ By default, just:

```bash
npx remult-cli
```

2/ You want to know more? Here you go, use the `--help` flag

```bash
npx remult-cli --help

	Options:
	--help              Show help                                        [boolean]
	--version           Show version number                              [boolean]
	--connectionString  Your PostgreSQL database connection string. Only
						PostgreSQL databases are supported.                         [string]
	--tableProps                                   [default: "allowApiCrud: true"]
	--output                                             [default: "./src/shared"]

	Examples:
	npx remult-cli --connectionString postgres://user:pass@host:port/db-name
```

3/ remult-cli can also read from your .env file and set all values.

```bash
DATABASE_URL = "postgres://user:pass@host:port/db-name"
OUTPUT = "./fancy/place"
TABLE_PROPS = "allowApiCrud: (r) => r?.authenticated() ?? false"
```

then `npx remult-cli`

## Development

```
git clone https://github.com/Yedidyar/remult-cli.git

pnpm i

pnpm dev

pnpm start
```

## Suggestions for improvement

- Add support for other databases, such as MySQL and Oracle.

## License

remult-cli is licensed under the MIT License.
