import { describe, expect, test } from "vitest";
import { promisify } from "util";
import { exec as child_process_exec } from "child_process";
import { genId } from "../src/utils/genId";
const getOutput = genId("integration-test-output");
const exec = promisify(child_process_exec);
const connectionString = "postgres://postgres:postgres@localhost:5432";
const lsOutputToArray = (stdout: string) => stdout.slice(0, -1).split("\n");

describe("postgres tests", () => {
	describe("check that file structure is correct", () => {
		const output = getOutput();
		test("when db is empty should return bare file structure", async () => {
			await exec(
				`pnpm start pull --output ./${output} --connectionString ${connectionString}`,
			);
			const rootLs = await exec(`ls ${output}`);

			expect(lsOutputToArray(rootLs.stdout)).toStrictEqual([
				"entities",
				"enums",
			]);

			const entitiesLs = await exec(`ls ./${output}/entities`);
			expect(lsOutputToArray(entitiesLs.stdout)).toStrictEqual(["index.ts"]);
		});
	});
	describe("bookstore schema", () => {
		test("when pull with schemas flag", async () => {
			const output = getOutput();
			await exec(
				`pnpm start pull --output ./${output} --connectionString ${connectionString}/bookstore_db --schemas bookstore`,
			);
			const entitiesDir = `./${output}/entities`;
			const enumsDir = `./${output}/enums`;

			const entitiesLs = await exec(`ls ${entitiesDir}`);
			expect(lsOutputToArray(entitiesLs.stdout)).toStrictEqual([
				"Bookstore_Author.ts",
				"Bookstore_Book.ts",
				"Bookstore_Customer.ts",
				"Bookstore_Order.ts",
				"Bookstore_OrderItem.ts",
				"index.ts",
			]);

			const enumLs = await exec(`ls ${enumsDir}`);
			expect(lsOutputToArray(enumLs.stdout)).toStrictEqual([
				"BookGenre.ts",
				"index.ts",
			]);

			const bookGenreFile = await exec(`cat ${enumsDir}/BookGenre.ts`);
			expect(bookGenreFile.stdout)
				.toStrictEqual(`import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class BookGenre {
  static FANTASY = new BookGenre('Fantasy', 'Fantasy')
  static HISTORICAL = new BookGenre('Historical', 'Historical')
  static MYSTERY = new BookGenre('Mystery', 'Mystery')
  static NON_FICTION = new BookGenre('Non-Fiction', 'Non Fiction')
  static ROMANCE = new BookGenre('Romance', 'Romance')
  static SCIENCE_FICTION = new BookGenre('Science Fiction', 'Science Fiction')
  static THRILLER = new BookGenre('Thriller', 'Thriller')
  static YOUNG_ADULT = new BookGenre('Young Adult', 'Young Adult')

  constructor(public id: string, public caption: string) {}
}
`);

			const authorFile = await exec(`cat ${entitiesDir}/Bookstore_Author.ts`);
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
`,
			);

			const bookFile = await exec(`cat ${entitiesDir}/Bookstore_Book.ts`);
			expect(bookFile.stdout)
				.toStrictEqual(`import { Entity, Field, Fields } from 'remult'
import { Relations } from 'remult'
import { Bookstore_Author } from '.'
import { Bookstore_OrderItem } from '.'
import { BookGenre } from '../enums'

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

	@Field(() => BookGenre, { inputType: 'selectEnum', allowNull: true })
	genre?: BookGenre

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
`);

			const customerFile = await exec(
				`cat ${entitiesDir}/Bookstore_Customer.ts`,
			);
			expect(customerFile.stdout)
				.toStrictEqual(`import { Entity, Fields, Validators } from 'remult'
import { Relations } from 'remult'
import { Bookstore_Order } from '.'

@Entity<Bookstore_Customer>('customers', {
	allowApiCrud: true,
	dbName: 'bookstore.customers',
	id: { customer_id: true }
})
export class Bookstore_Customer {
	@Fields.autoIncrement()
	customer_id!: number

	@Fields.string()
	first_name!: string

	@Fields.string()
	last_name!: string

	@Fields.string({ validate: [Validators.unique], inputType: 'email' })
	email!: string

	@Fields.string({ allowNull: true })
	address?: string

	@Fields.dateOnly()
	join_date = new Date()

  // Relations toMany
	@Relations.toMany(() => Bookstore_Order)
	orders?: Bookstore_Order[]
}
`);

			const orderFile = await exec(`cat ${entitiesDir}/Bookstore_Order.ts`);
			expect(orderFile.stdout)
				.toStrictEqual(`import { Entity, Field, Fields } from 'remult'
import { Relations } from 'remult'
import { Bookstore_Customer } from '.'
import { Bookstore_OrderItem } from '.'

@Entity<Bookstore_Order>('orders', {
	allowApiCrud: true,
	dbName: 'bookstore.orders',
	id: { order_id: true, customer_id: true }
})
export class Bookstore_Order {
	@Fields.autoIncrement()
	order_id!: number

	@Fields.date()
	order_date = new Date()

	@Fields.integer({ allowNull: true })
	customer_id?: number

	@Relations.toOne(() => Bookstore_Customer, { field: 'customer_id' })
	customer?: Bookstore_Customer

	@Fields.number()
	total_amount!: number

  // Relations toMany
	@Relations.toMany(() => Bookstore_OrderItem)
	orderItems?: Bookstore_OrderItem[]
}
`);

			const orderItemFile = await exec(
				`cat ${entitiesDir}/Bookstore_OrderItem.ts`,
			);
			expect(orderItemFile.stdout)
				.toStrictEqual(`import { Entity, Field, Fields } from 'remult'
import { Relations } from 'remult'
import { Bookstore_Order } from '.'
import { Bookstore_Book } from '.'

@Entity<Bookstore_OrderItem>('orderItems', {
	allowApiCrud: true,
	dbName: 'bookstore.order_items',
	id: { order_item_id: true, order_id: true, book_id: true }
})
export class Bookstore_OrderItem {
	@Fields.autoIncrement()
	order_item_id!: number

	@Fields.integer({ allowNull: true })
	order_id?: number

	@Relations.toOne(() => Bookstore_Order, { field: 'order_id' })
	order?: Bookstore_Order

	@Fields.integer({ allowNull: true })
	book_id?: number

	@Relations.toOne(() => Bookstore_Book, { field: 'book_id' })
	book?: Bookstore_Book

	@Fields.integer()
	quantity!: number

	@Fields.number()
	price_at_time_of_order!: number
}
`);

			const indexFile = await exec(`cat ${entitiesDir}/index.ts`);
			expect(indexFile.stdout)
				.toStrictEqual(`import { Bookstore_Author } from './Bookstore_Author'
import { Bookstore_Book } from './Bookstore_Book'
import { Bookstore_Customer } from './Bookstore_Customer'
import { Bookstore_Order } from './Bookstore_Order'
import { Bookstore_OrderItem } from './Bookstore_OrderItem'

export const entities = [
	Bookstore_Author,
  Bookstore_Book,
  Bookstore_Customer,
  Bookstore_Order,
  Bookstore_OrderItem
]

export {
	Bookstore_Author,
  Bookstore_Book,
  Bookstore_Customer,
  Bookstore_Order,
  Bookstore_OrderItem
}`);
		});
	});
});
