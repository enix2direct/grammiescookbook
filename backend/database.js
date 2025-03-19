const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./recipes.db');

db.serialize(() => {
  // Create ingredients table
  db.run(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      calories REAL DEFAULT NULL,
      protein REAL DEFAULT NULL,
      carbs REAL DEFAULT NULL,
      fat REAL DEFAULT NULL
    )
  `);

  // Create recipe_ingredients junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      ingredient_id INTEGER,
      quantity TEXT NOT NULL, -- e.g., "2", "1 1/2"
      unit TEXT,             -- e.g., "cups", "tbsp"
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    )
  `);

  // Update recipes table
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      instructions TEXT,
      category TEXT,
      is_meal_plan_candidate INTEGER DEFAULT 0,
      thumbnail_url TEXT
    )
  `);

  // Update meals table to include quantity
  db.run(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      date TEXT,
      quantity INTEGER DEFAULT 1, -- Add quantity column
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    )
  `);

  // Drop ingredients column from recipes if it exists (one-time migration)
  db.run(`ALTER TABLE recipes DROP COLUMN ingredients`, (err) => {
    if (err && !err.message.includes('no such column')) {
      console.error('Error dropping ingredients column:', err.message);
    }
  });
});

module.exports = db;