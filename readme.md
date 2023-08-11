## Install

```bash
$ npm install --global @remult/cli
```

## CLI

```
$ remult --help

	Usage
	  $ remult

	Options
		--connectionString  Your connectionString only postgres is supported
		--tables  you can pass multiple
		--dir the directory that the entities will

	Examples
	  $ remult --connectionString=postgres://user:pass@host:port/db-name --tables=users --tables=permissions --dir=./shared/entities
```

## Development

```
git clone https://github.com/Yedidyar/remult-cli.git

npm i -g

npm run dev
```

you can play with it in another terminal:

```
remult --connectionString=postgres://user:pass@host:port/db-name --tables=users --tables=permissions --dir=./shared/entities
```
