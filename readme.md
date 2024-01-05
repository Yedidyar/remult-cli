<div align="center">
		<img src="https://raw.githubusercontent.com/Yedidyar/remult-cli/main/assets/logo.png" width="200" height="200">
  <h1>Remult CLI</h1>

 <a href="https://raw.githubusercontent.com/remult/remult/master/LICENSE" rel="nofollow">
		<img alt="GitHub license" src="https://img.shields.io/badge/license-MIT-blue.svg">
	</a>
	<a href="https://www.npmjs.com/package/remult-cli" rel="nofollow">
        	<img src="https://img.shields.io/npm/v/remult-cli.svg?style=flat"/>
  </a>
</div>

`remult-cli` is a command-line tool designed to simplify the process of generating [Remult](https://remult.dev/) entities from a PostgreSQL database.

Inspired by `prisma db pull`, this tool streamlines the creation of Remult entities, making database integration smoother and more efficient.

## Usage

### Basic Usage

Generate Remult entities using the default settings:

```bash
npx remult-cli pull
```

### Advanced Usage

For more advanced usage, you can utilize the `--help` flag to explore the available options:

```bash
npx remult-cli --help
```

### Examples

```bash
# All entities from two schemas:
npx remult-cli pull --schemas auth public

# All entities from all schemas:
npx remult-cli pull --schemas '*'
```

#### Options

- `--connectionString`: Your PostgreSQL database connection string. Only PostgreSQL databases are supported.
- `--tableProps`: Customize properties for generated tables (default: `allowApiCrud: true`).
- `--output`: Define the output directory for the generated Remult entities (default: `./src/shared`).
- `--defaultOrderBy`: Will put a default order by if we see one of this column name. (default: `order,name`).
- `--customDecorators`: Will replace the default decorator by a custom one. (Should be a stringified JSON object).
  Let's describe this example: `{"@Fields.string":"@KitFields.string#@kitql/remult"}`, here we replace the default `@Fields.string` decorator by `@KitFields.string` from the `@kitql/remult` import.

### Environmental Variables

Alternatively, you can utilize a `.env` file to set configuration values. Example:

```env
DATABASE_URL=postgres://user:pass@host:port/db-name
TABLE_PROPS=allowApiCrud: (r) => r?.authenticated() ?? false
OUTPUT=./fancy/place
DEFAULT_ORDER_BY = "order,name,nom,username"
CUSTOM_DECORATORS = '{"@Fields.string":"@KitFields.string#@kitql/remult","@Fields.dateOnly":"@KitFields.dateOnly#@kitql/remult"}'
```

After setting up your `.env` file, run the following command:

```bash
npx remult-cli pull
```

## Development

1. Clone the repository:

```bash
git clone https://github.com/Yedidyar/remult-cli.git
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Begin development:

```bash
pnpm start
```

5. Run CI locally with 🌍 earthly 🌍
   - Install [earthly](https://earthly.dev/get-earthly) for yours OS (you can see there yours OS pre-requisites)
   - Run `earthly -P +all` (you can also add the `--interactive` flag for debugging)

## Contribution

We welcome contributions from the community! If you find any issues or have ideas for enhancements, please submit bug reports, feature requests, or pull requests through our [GitHub repository](https://github.com/Yedidyar/remult-cli).

## License

`remult-cli` is licensed under the MIT License.
