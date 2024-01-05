CREATE SCHEMA bookstore;

SET search_path TO bookstore;

CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(13),
    publication_year INT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    author_id INT REFERENCES authors(author_id) ON DELETE SET NULL
);

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price_at_time_of_order DECIMAL(10, 2) NOT NULL
);
