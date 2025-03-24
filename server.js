import express from "express";
import cors from "cors";
import { DateTime } from "luxon";
import db from "./resources/js/database.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Create tables
db.run(
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    ${Array.from({ length: 8 }, (_, i) => `ingredient${i + 1} TEXT, ingredient${i + 1}_qty REAL`).join(", ")}
  )`,
  (err) => err ? console.error("Error creating products table:", err.message) : console.log("Products table ready")
);

db.run(
  `CREATE TABLE IF NOT EXISTS supplies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit REAL NOT NULL
  )`,
  (err) => err ? console.error("Error creating supplies table:", err.message) : console.log("Supplies table ready")
);

db.run(
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    amount REAL NOT NULL,
    order_time TEXT NOT NULL
  )`,
  (err) => err ? console.error("Error creating orders table:", err.message) : console.log("Orders table ready")
);

// Get GMT+8 time
const getGMT8Time = () => DateTime.now().setZone("Asia/Manila").toFormat("yyyy-MM-dd HH:mm:ss");

// Save Order and Deduct Supplies
app.post("/checkout", (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ error: "Invalid or empty order data." });
  }

  db.serialize(() => {
    const orderStmt = db.prepare("INSERT INTO orders (product, quantity, amount, order_time) VALUES (?, ?, ?, ?)");
    const orderTime = getGMT8Time();

    db.run("BEGIN TRANSACTION");

    try {
      orders.forEach((order) => {
        const { product, quantity, amount } = order;

        // Step 1: Look up the product in the products table
        db.get("SELECT * FROM products WHERE name = ?", [product], (err, productRow) => {
          if (err) throw new Error(`Database error: ${err.message}`);
          if (!productRow) throw new Error(`Product ${product} not found in database`);

          // Step 2: Validate amount (optional)
          const expectedAmount = productRow.price * quantity;
          if (Math.abs(expectedAmount - amount) > 0.01) {
            throw new Error(`Amount mismatch for ${product}: expected ${expectedAmount}, got ${amount}`);
          }

          // Step 3: Check and deduct supplies before updating
          for (let i = 1; i <= 8; i++) {
            const ingredientName = productRow[`ingredient${i}`];
            const ingredientQty = productRow[`ingredient${i}_qty`];
            if (ingredientName && ingredientQty > 0) {
              const deduction = ingredientQty * quantity;

              // Check supply availability first
              db.get("SELECT quantity FROM supplies WHERE name = ?", [ingredientName], (err, supplyRow) => {
                if (err) throw new Error(`Failed to check supply ${ingredientName}: ${err.message}`);
                if (!supplyRow) throw new Error(`Supply ${ingredientName} not found`);
                if (supplyRow.quantity < deduction) {
                  throw new Error(`Insufficient supply for ${ingredientName}: ${supplyRow.quantity} available, ${deduction} needed`);
                }

                // If sufficient, proceed with deduction
                db.run(
                  "UPDATE supplies SET quantity = quantity - ? WHERE name = ?",
                  [deduction, ingredientName],
                  function (err) {
                    if (err) throw new Error(`Failed to update supply ${ingredientName}: ${err.message}`);
                    if (this.changes === 0) throw new Error(`Supply ${ingredientName} not found`);
                  }
                );
              });
            }
          }

          // Insert order into orders table after supply checks
          orderStmt.run(product, quantity, amount, orderTime);
        });
      });

      db.run("COMMIT", (err) => {
        if (err) throw new Error(`Commit failed: ${err.message}`);
        orderStmt.finalize();
        res.json({ message: "✅ Order successfully saved and supplies updated!", time: orderTime });
      });
    } catch (error) {
      db.run("ROLLBACK", () => {
        orderStmt.finalize();
        res.status(500).json({ error: error.message });
      });
    }
  });
});

// Fetch Orders
app.get("/orders", (req, res) => {
  db.all("SELECT product, quantity, amount, order_time FROM orders", [], (err, rows) =>
    err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

// Add Product
app.post("/add-product", (req, res) => {
  const { name, description, price, ingredients = [] } = req.body;
  if (!name || price == null) return res.status(400).json({ error: "Missing required fields: name or price." });

  const ingredientData = Array.from({ length: 8 }, (_, i) => ({
    name: ingredients[i]?.name || null,
    qty: ingredients[i]?.qty ? parseFloat(ingredients[i].qty) : null,
  }));

  const query = `INSERT INTO products (name, description, price, ${ingredientData.map((_, i) => `ingredient${i + 1}, ingredient${i + 1}_qty`).join(", ")}) 
                 VALUES (?, ?, ?, ${Array(16).fill("?").join(", ")})`;

  db.run(query, [name, description || null, parseFloat(price), ...ingredientData.flatMap(i => [i.name, i.qty])], function (err) {
    err ? res.status(500).json({ error: "Failed to insert product", details: err.message }) : res.json({ message: "✅ Product added successfully!", id: this.lastID });
  });
});

// Update Product
app.put("/update-product/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price, ingredients = [] } = req.body;
  if (!name || price == null) return res.status(400).json({ error: "Missing required fields: name or price." });

  const ingredientData = Array.from({ length: 8 }, (_, i) => ({
    name: ingredients[i]?.name || null,
    qty: ingredients[i]?.qty ? parseFloat(ingredients[i].qty) : null,
  }));

  const query = `UPDATE products SET name = ?, description = ?, price = ?, ${ingredientData.map((_, i) => `ingredient${i + 1} = ?, ingredient${i + 1}_qty = ?`).join(", ")} WHERE id = ?`;

  db.run(query, [name, description || null, parseFloat(price), ...ingredientData.flatMap(i => [i.name, i.qty]), id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to update product", details: err.message });
    this.changes === 0 ? res.status(404).json({ error: "Product not found" }) : res.json({ message: "✅ Product updated successfully!" });
  });
});

// Delete Product
app.delete("/delete-product/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to delete product", details: err.message });
    this.changes === 0 ? res.status(404).json({ error: "Product not found" }) : res.json({ message: "✅ Product deleted successfully!" });
  });
});

// Fetch Products
app.get("/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) =>
    err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

// Add a Supply
app.post("/add-supply", (req, res) => {
  const { name, quantity, unit, price_per_unit } = req.body;
  if (!name || !unit || quantity == null || price_per_unit == null) {
    return res.status(400).json({ error: "Missing required fields: name, quantity, unit, price_per_unit." });
  }

  db.run(
    "INSERT INTO supplies (name, quantity, unit, price_per_unit) VALUES (?, ?, ?, ?)",
    [name, quantity, unit, price_per_unit],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to insert supply", details: err.message });
      }
      res.json({ message: "✅ Supply added successfully!", id: this.lastID });
    }
  );
});

// Fetch Supplies
app.get("/supplies", (req, res) => {
  db.all("SELECT * FROM supplies", [], (err, rows) =>
    err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

// Update a Supply
app.put("/update-supply/:id", (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit, price_per_unit } = req.body;
  if (!name || !unit || quantity == null || price_per_unit == null) {
    return res.status(400).json({ error: "Missing required fields: name, quantity, unit, price_per_unit." });
  }

  db.run(
    "UPDATE supplies SET name = ?, quantity = ?, unit = ?, price_per_unit = ? WHERE id = ?",
    [name, quantity, unit, price_per_unit, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to update supply", details: err.message });
      }
      this.changes === 0
        ? res.status(404).json({ error: "Supply not found" })
        : res.json({ message: "✅ Supply updated successfully!" });
    }
  );
});

// Delete a Supply
app.delete("/delete-supply/:id", (req, res) => {
  db.run("DELETE FROM supplies WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete supply", details: err.message });
    }
    this.changes === 0
      ? res.status(404).json({ error: "Supply not found" })
      : res.json({ message: "✅ Supply deleted successfully!" });
  });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));