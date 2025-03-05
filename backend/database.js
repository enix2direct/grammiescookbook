const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('recipes.db');
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY, title TEXT, instructions TEXT, category TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS ingredients (id INTEGER PRIMARY KEY, recipe_id INTEGER, quantity REAL, unit TEXT, name TEXT, FOREIGN KEY(recipe_id) REFERENCES recipes(id))');
  db.run('CREATE TABLE IF NOT EXISTS meals (id INTEGER PRIMARY KEY, recipe_id INTEGER, date TEXT, FOREIGN KEY(recipe_id) REFERENCES recipes(id))');
});
module.exports = db;