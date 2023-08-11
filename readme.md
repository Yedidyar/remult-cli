# remult-cli

remult-cli is a command-line tool for generating Remult entities from a PostgreSQL database. It is easy to use, versatile, and customizable.

## Installation
```
npm install --global @remult/cli
```

## Usage

```
$ remult --help

	Usage
	  $ remult

	Options
		--connectionString  Your PostgreSQL database connection string. Only PostgreSQL databases are supported.
		--tables  Specify one or more table names for which you want to generate TypeScript entities.
		--dir Specify the directory where the generated TypeScript entities will be saved.

	Examples
	  $ remult --connectionString=postgres://user:pass@host:port/db-name --tables=users --tables=permissions --dir=./shared/entities
```

## Development
```
git clone https://github.com/Yedidyar/remult-cli.git

npm i -g

npm run dev
```

## Features

* Generate Renult entities from a PostgreSQL database.
* Support for multiple tables.
* Customizable directory for generated entities.
* Easy to use.

## Suggestions for improvement

* Add support for other databases, such as MySQL and Oracle.

## License

remult-cli is licensed under the MIT License.
