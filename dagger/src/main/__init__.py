import contextlib

import dagger
from dagger import dag, function, object_type


@contextlib.asynccontextmanager
async def managed_service(svc: dagger.Service):
	"""Start and stop a service."""
	yield await svc.start()
	await svc.stop()


@object_type
class RemultCli:
	@function
	async def test(self, source: dagger.Directory) -> str:
		"""Return the result of running unit tests"""
		postgres = (
			dag.container()
			.from_("postgres:14-alpine")
			.with_env_variable("POSTGRES_PASSWORD", "postgres")
			.with_env_variable("POSTGRES_USER", "postgres")
			.with_env_variable("POSTGRES_DB", "bookstore_db")
			.with_mounted_cache("/var/lib/postgresql/data", dag.cache_volume("my-postgres"))
			.with_exposed_port(5432)
			.as_service()
		)

		async with managed_service(postgres) as postgres_srv:
			await (
				dag.container()
				.from_("postgres:14-alpine")
				.with_service_binding("db", postgres_srv)
				.with_directory("/app", source)
				.with_workdir("/app")
				.with_exec(
					["/usr/local/bin/psql", "postgres://postgres:postgres@db:5432", "-a", "-f",
					 "/app/scripts/db/bookstore-schecma.sql"])
			)

			return await (
				self.build_env(source)
				.with_service_binding("db", postgres_srv)
				.with_exec(["pnpm", "test"])
				.stdout()
			)

	@function
	def build_env(self, source: dagger.Directory) -> dagger.Container:
		"""Build a ready-to-use development environment"""
		node_cache = dag.cache_volume("node")
		return (
			dag.container()
			.from_("node:21-slim")
			.with_directory("/src", source)
			.with_mounted_cache("/src/node_modules", node_cache)
			.with_workdir("/src")
			.with_exec(["npm", "install", "-g", "pnpm"])
			.with_exec(["pnpm", "install"])
		)
