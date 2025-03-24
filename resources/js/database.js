import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database/orders.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");

        // Create Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            amount REAL NOT NULL,
            order_time TEXT NOT NULL
        )`);

        // Create Products Table

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            ingredient1 TEXT,
            ingredient1_qty REAL,
            ingredient2 TEXT,
            ingredient2_qty REAL,
            ingredient3 TEXT,
            ingredient3_qty REAL,
            ingredient4 TEXT,
            ingredient4_qty REAL,
            ingredient5 TEXT,
            ingredient5_qty REAL,
            ingredient6 TEXT,
            ingredient6_qty REAL,
            ingredient7 TEXT,
            ingredient7_qty REAL,
            ingredient8 TEXT,
            ingredient8_qty REAL
          )`, (err) => {
            if (err) console.error("Error creating products table:", err);
          });
        
        db.run(`CREATE TABLE IF NOT EXISTS supplies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            price_per_unit REAL NOT NULL
        )`);
        
    }
});


export default db;
