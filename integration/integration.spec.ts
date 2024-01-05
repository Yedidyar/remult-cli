import { describe, expect, test } from "vitest";
import { promisify } from "util";
import { exec as child_process_exec } from "child_process";
import { genId } from "../src/utils/genId"
const getOutput = genId("output")
const exec = promisify(child_process_exec);
const connectionString = "postgres://postgres:postgres@localhost:5432"
const lsOutputToArray = (stdout: string) => stdout.slice(0, -1).split("\n")

describe("postgres tests", () => {
    describe("check that file stracture is correct", () => {
        const output = getOutput()
        test("when db is empty shoud return bare file structure", async () => {
            await exec(
                `pnpm start pull --output ./${output} --connectionString ${connectionString}`,
            );
            const rootLs = await exec(`ls ${output}`);

            expect(lsOutputToArray(rootLs.stdout)).toStrictEqual(["entities", "enums"]);

            const entitiesLs = await exec(`ls ./${output}/entities`);
            expect(lsOutputToArray(entitiesLs.stdout)).toStrictEqual(["index.ts"]);
        });
    });
    describe("bookstore schema", () => {
        test("when pull with schemas flag", async () => {
            const output = getOutput()
            await exec(
                `pnpm start pull --output ./${output} --connectionString ${connectionString}/bookstore_db --schemas bookstore`,
            );
            const entitiesLs = await exec(`ls ./${output}/entities`);
            expect(lsOutputToArray(entitiesLs.stdout)).toStrictEqual([
                "Bookstore_Author.ts",
                "Bookstore_Book.ts",
                "Bookstore_Customer.ts",
                "Bookstore_Order.ts",
                "Bookstore_OrderItem.ts",
                "index.ts",
            ]);
            const authorFile = await exec(`cat ./${output}/entities/Bookstore_Author.ts`);

            expect(authorFile.stdout).toStrictEqual(
                `import { Entity, Fields } from 'remult'
import { Relations } from 'remult'
import { Bookstore_Book } from '.'

@Entity<Bookstore_Author>('authors', {
\tallowApiCrud: true,
\tdbName: 'bookstore.authors',
\tdefaultOrderBy: { name: 'asc' },
\tid: { author_id: true }
})
export class Bookstore_Author {
\t@Fields.autoIncrement()
\tauthor_id!: number

\t@Fields.string()
\tname!: string

\t@Fields.string({ allowNull: true })
\tbio?: string

  // Relations toMany
\t@Relations.toMany(() => Bookstore_Book)
\tbooks?: Bookstore_Book[]
}
`)

        });
    });
});
