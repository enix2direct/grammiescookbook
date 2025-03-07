const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./recipes.db');

// Create recipes table with is_meal_plan_candidate column
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      instructions TEXT,
      category TEXT,
      is_meal_plan_candidate INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      date TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    )
  `);
});

module.exports = db;