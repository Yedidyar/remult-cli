import { describe, test } from "vitest"
import { promisify } from "util"
import { exec as child_process_exec } from "child_process"
describe('postgres tests', () => {
    test('sanity', async () => {
        const exec = promisify(child_process_exec);
        await exec("pnpm start pull --output ./output --connectionString postgres://postgres:postgres@localhost:5432")
    })
});
