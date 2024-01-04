import { describe, expect, test } from "vitest"
import { promisify } from "util"
import { exec as child_process_exec } from "child_process"
describe('postgres tests', () => {
    describe("check that file stracture is correct", () => {
        test('when db is empty shoud return bare file structure', async () => {
            const exec = promisify(child_process_exec);
            await exec("pnpm start pull --output ./output --connectionString postgres://postgres:postgres@localhost:5432")
            const rootLs = await exec("ls output")

            expect(rootLs.stdout).toBe("entities\nenums\n")

            const entitiesLs = await exec("ls ./output/entities")
            expect(entitiesLs.stdout).toBe("index.ts\n")
        })
    })
});
