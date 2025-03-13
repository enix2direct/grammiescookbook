const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./recipes.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    ingredients TEXT,
    instructions TEXT,
    category TEXT,
    is_meal_plan_candidate INTEGER DEFAULT 0,
    thumbnail_url TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER,
    date TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  )`);

  // Clear existing recipes
  db.run('DELETE FROM recipes');

  // Insert 10 recipes with new categories and some thumbnails
  const recipes = [
    { title: 'Scrambled Eggs', ingredients: '2 eggs, 1 tbsp milk', instructions: 'Whisk eggs and milk, cook in a pan.', category: 'breakfast', thumbnail_url: 'https://media.istockphoto.com/id/1335061999/photo/traditional-scrambled-egg-breakfast-with-bacon-and-toast.jpg?b=1&s=612x612&w=0&k=20&c=gZm_9wTNMZx5FjAJtnqCNW1V46z8nCLDEr7Lu9lSodM=' },
    { title: 'Stuffed Mushrooms', ingredients: '10 mushrooms, 1/2 cup breadcrumbs, 1/4 cup cheese', instructions: 'Stuff mushrooms, bake at 375°F for 20 mins.', category: 'appetizer', thumbnail_url: 'https://media.istockphoto.com/id/617387012/photo/stuffed-mushrooms.jpg?b=1&s=612x612&w=0&k=20&c=pfWHxmzY89MqTNRj5BrIX7ByIZmTolWA9Cg1FqzW78w=' },
    { title: 'Grilled Chicken', ingredients: '2 chicken breasts, 1 tsp salt, 1 tsp pepper', instructions: 'Grill chicken for 6-8 mins per side.', category: 'entree', thumbnail_url: 'https://www.foodiesfeed.com/wp-content/uploads/ff-images/2025/01/grilled-lemon-herb-chicken-with-fresh-rosemary.png' },
    { title: 'Mashed Potatoes', ingredients: '4 potatoes, 1/2 cup milk, 2 tbsp butter', instructions: 'Boil potatoes, mash with milk and butter.', category: 'side dish', thumbnail_url: 'https://media.istockphoto.com/id/1750526843/photo/creamy-parmesan-polenta.jpg?b=1&s=612x612&w=0&k=20&c=0tnCrV_J7dSeoRi5giJeQTtwR2Ci01ni3a6r2KC6OHQ=' },
    { title: 'Chocolate Cake', ingredients: '2 cups flour, 1 cup sugar, 1/2 cup cocoa', instructions: 'Mix ingredients, bake at 350°F for 30 mins.', category: 'dessert', thumbnail_url: 'https://media.istockphoto.com/id/1370520449/photo/slice-of-chocolate-cake-with-glaze.jpg?b=1&s=612x612&w=0&k=20&c=U1RM_7-jvg2vmVq5onRgRrD1UEYFXA8e4VFsxOU3WjI=' },
    { title: 'Trail Mix', ingredients: '1 cup nuts, 1/2 cup raisins, 1/2 cup chocolate chips', instructions: 'Mix all ingredients in a bowl.', category: 'snack', thumbnail_url: 'https://media.istockphoto.com/id/1189549483/photo/jar-of-trail-mix.jpg?b=1&s=612x612&w=0&k=20&c=muyzGAegdGYmAv_vQ9UIbKfxGRQX5UyTzL6mcPilA-0=' },
    { title: 'Pancakes', ingredients: '1 cup flour, 1 egg, 1 cup milk', instructions: 'Mix batter, cook on griddle.', category: 'breakfast', thumbnail_url: 'https://exahttps://media.istockphoto.com/id/2172549709/photo/soft-stack-of-pancakes-topped-with-butter-on-a-white-plate-served-in-an-american-diner.jpg?b=1&s=612x612&w=0&k=20&c=lRZXdOH_LkRf5lUyPU8rwQDzpFxd2iFGGgahFXdtLk4=mple.com/pancakes.jpg' },
    { title: 'Bruschetta', ingredients: '1 baguette, 2 tomatoes, 1 tbsp olive oil', instructions: 'Toast bread, top with tomato mix.', category: 'appetizer', thumbnail_url: 'https://www.foodiesfeed.com/wp-content/uploads/ff-images/2025/01/colorful-breakfast-spread-on-a-rustic-plate.png' },
    { title: 'Beef Stew', ingredients: '1 lb beef, 2 carrots, 2 potatoes', instructions: 'Simmer all ingredients for 2 hours.', category: 'entree', thumbnail_url: 'https://media.istockphoto.com/id/599498966/photo/beef-meat-stewed-with-potatoes.jpg?b=1&s=612x612&w=0&k=20&c=QtnFmCmWxFQ6B37PZguyswnWLXXtDtp76tnUFV6upx0=' },
    { title: 'Fruit Salad', ingredients: '1 apple, 1 banana, 1 cup grapes', instructions: 'Chop fruit, mix together.', category: 'snack', thumbnail_url: 'https://media.istockphoto.com/id/2197322106/photo/fruit-salad.jpg?b=1&s=612x612&w=0&k=20&c=8ZBqkOir2jfSkOO8dwfkNAG0pVe0xYjPg7QYgvlr4t4=' },
  ];

  const stmt = db.prepare('INSERT INTO recipes (title, ingredients, instructions, category, thumbnail_url) VALUES (?, ?, ?, ?, ?)');
  recipes.forEach(recipe => {
    stmt.run(recipe.title, recipe.ingredients, recipe.instructions, recipe.category, recipe.thumbnail_url);
  });
  stmt.finalize();

  console.log('Database seeded with 10 recipes.');
});

db.close();