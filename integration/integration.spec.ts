import { describe, expect, test } from "vitest";
import { promisify } from "util";
import { exec as child_process_exec } from "child_process";
import { genId } from "../src/utils/genId"
const getOutput = genId("integration-test-output")
const exec = promisify(child_process_exec);
const connectionString = "postgres://postgres:postgres@localhost:5432"
const lsOutputToArray = (stdout: string) => stdout.slice(0, -1).split("\n")

describe("postgres tests", () => {
    describe("check that file structure is correct", () => {
        const output = getOutput()
        test("when db is empty should return bare file structure", async () => {
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
	allowApiCrud: true,
	dbName: 'bookstore.authors',
	defaultOrderBy: { name: 'asc' },
	id: { author_id: true }
})
export class Bookstore_Author {
	@Fields.autoIncrement()
	author_id!: number

	@Fields.string()
	name!: string

	@Fields.string({ allowNull: true })
	bio?: string

  // Relations toMany
	@Relations.toMany(() => Bookstore_Book)
	books?: Bookstore_Book[]
}
`)

            const bookFile = await exec(`cat ./${output}/entities/Bookstore_Book.ts`);

            expect(bookFile.stdout).toStrictEqual(`import { Entity, Field, Fields } from 'remult'
import { Relations } from 'remult'
import { Bookstore_Author } from '.'
import { Bookstore_OrderItem } from '.'

@Entity<Bookstore_Book>('books', {
	allowApiCrud: true,
	dbName: 'bookstore.books',
	id: { book_id: true, author_id: true }
})
export class Bookstore_Book {
	@Fields.autoIncrement()
	book_id!: number

	@Fields.string()
	title!: string

	@Fields.string({ allowNull: true })
	isbn?: string

	@Fields.integer({ allowNull: true })
	publication_year?: number

	@Fields.number()
	price!: number

	@Fields.integer()
	stock_quantity!: number

	@Fields.integer({ allowNull: true })
	author_id?: number

	@Relations.toOne(() => Bookstore_Author, { field: 'author_id' })
	author?: Bookstore_Author

  // Relations toMany
	@Relations.toMany(() => Bookstore_OrderItem)
	orderItems?: Bookstore_OrderItem[]
}
`)


        });
    });
});
