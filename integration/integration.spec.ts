import { describe, expect, test } from "vitest"
import { promisify } from "util"
import { exec as child_process_exec } from "child_process"

const exec = promisify(child_process_exec);

describe('postgres tests', () => {
    describe("check that file stracture is correct", () => {
        test('when db is empty shoud return bare file structure', async () => {
            await exec("pnpm start pull --output ./output --connectionString postgres://postgres:postgres@localhost:5432")
            const rootLs = await exec("ls output")

            expect(rootLs.stdout).toBe("entities\nenums\n")

            const entitiesLs = await exec("ls ./output/entities")
            expect(entitiesLs.stdout).toBe("index.ts\n")
        })
    })
    describe("bookstore schema", () => {
        test('just genrate for now', async () => {
            await exec("pnpm start pull --output ./output1 --connectionString postgres://postgres:postgres@localhost:5432/bookstore_db --schemas bookstore")
        })
    })
});
