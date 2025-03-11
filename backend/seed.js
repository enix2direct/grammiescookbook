const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./recipes.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    ingredients TEXT,
    instructions TEXT,
    category TEXT,
    is_meal_plan_candidate INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER,
    date TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  )`);

  // Clear existing recipes
  db.run('DELETE FROM recipes');

  // Insert 10 recipes with new categories
  const recipes = [
    { title: 'Scrambled Eggs', ingredients: '2 eggs, 1 tbsp milk', instructions: 'Whisk eggs and milk, cook in a pan.', category: 'breakfast' },
    { title: 'Stuffed Mushrooms', ingredients: '10 mushrooms, 1/2 cup breadcrumbs, 1/4 cup cheese', instructions: 'Stuff mushrooms, bake at 375°F for 20 mins.', category: 'appetizer' },
    { title: 'Grilled Chicken', ingredients: '2 chicken breasts, 1 tsp salt, 1 tsp pepper', instructions: 'Grill chicken for 6-8 mins per side.', category: 'entree' },
    { title: 'Mashed Potatoes', ingredients: '4 potatoes, 1/2 cup milk, 2 tbsp butter', instructions: 'Boil potatoes, mash with milk and butter.', category: 'side dish' },
    { title: 'Chocolate Cake', ingredients: '2 cups flour, 1 cup sugar, 1/2 cup cocoa', instructions: 'Mix ingredients, bake at 350°F for 30 mins.', category: 'dessert' },
    { title: 'Trail Mix', ingredients: '1 cup nuts, 1/2 cup raisins, 1/2 cup chocolate chips', instructions: 'Mix all ingredients in a bowl.', category: 'snack' },
    { title: 'Pancakes', ingredients: '1 cup flour, 1 egg, 1 cup milk', instructions: 'Mix batter, cook on griddle.', category: 'breakfast' },
    { title: 'Bruschetta', ingredients: '1 baguette, 2 tomatoes, 1 tbsp olive oil', instructions: 'Toast bread, top with tomato mix.', category: 'appetizer' },
    { title: 'Beef Stew', ingredients: '1 lb beef, 2 carrots, 2 potatoes', instructions: 'Simmer all ingredients for 2 hours.', category: 'entree' },
    { title: 'Fruit Salad', ingredients: '1 apple, 1 banana, 1 cup grapes', instructions: 'Chop fruit, mix together.', category: 'snack' },
  ];

  const stmt = db.prepare('INSERT INTO recipes (title, ingredients, instructions, category) VALUES (?, ?, ?, ?)');
  recipes.forEach(recipe => {
    stmt.run(recipe.title, recipe.ingredients, recipe.instructions, recipe.category);
  });
  stmt.finalize();

  console.log('Database seeded with 10 recipes.');
});

db.close();