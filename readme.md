<div align="center">
		<img src="https://github.com/Yedidyar/remult-cli/tree/main/assets/logo.png" width="200" height="200">
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
npx remult-cli
```

### Advanced Usage

For more advanced usage, you can utilize the `--help` flag to explore the available options:

```bash
npx remult-cli --help
```

#### Options

- `--connectionString`: Your PostgreSQL database connection string. Only PostgreSQL databases are supported.
- `--tableProps`: Customize properties for generated tables (default: `allowApiCrud: true`).
- `--output`: Define the output directory for the generated Remult entities (default: `./src/shared`).

### Environmental Variables

Alternatively, you can utilize a `.env` file to set configuration values. Example:

```env
DATABASE_URL=postgres://user:pass@host:port/db-name
OUTPUT=./fancy/place
TABLE_PROPS=allowApiCrud: (r) => r?.authenticated() ?? false
```

After setting up your `.env` file, run the following command:

```bash
npx remult-cli
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

## Contribution

We welcome contributions from the community! If you find any issues or have ideas for enhancements, please submit bug reports, feature requests, or pull requests through our [GitHub repository](https://github.com/Yedidyar/remult-cli).

## License

`remult-cli` is licensed under the MIT License.
