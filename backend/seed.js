const sqlite3 = require('sqlite3').verbose();
const db = require('./database'); // Import database.js to initialize the schema

db.serialize(() => {
  // Clear existing data
  db.run('DELETE FROM recipes', (err) => {
    if (err) console.error('Error clearing recipes:', err.message);
  });
  db.run('DELETE FROM ingredients', (err) => {
    if (err) console.error('Error clearing ingredients:', err.message);
  });
  db.run('DELETE FROM recipe_ingredients', (err) => {
    if (err) console.error('Error clearing recipe_ingredients:', err.message);
  });
  db.run('DELETE FROM meals', (err) => {
    if (err) console.error('Error clearing meals:', err.message);
  });

  // Insert ingredients
  const ingredientsStmt = db.prepare('INSERT INTO ingredients (name) VALUES (?)');
  const ingredients = [
    'eggs', 'milk', 'mushrooms', 'breadcrumbs', 'cheese', 'chicken breasts', 
    'salt', 'pepper', 'potatoes', 'butter', 'flour', 'sugar', 'cocoa', 
    'nuts', 'raisins', 'chocolate chips', 'baguette', 'tomatoes', 'olive oil', 
    'beef', 'carrots', 'apple', 'banana', 'grapes'
  ];
  ingredients.forEach(name => ingredientsStmt.run(name));
  ingredientsStmt.finalize();

  // Insert recipes
  const recipesStmt = db.prepare('INSERT INTO recipes (title, instructions, category, thumbnail_url, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)');
  const recipes = [
    { title: 'Scrambled Eggs', instructions: 'Whisk eggs and milk, cook in a pan.', category: 'breakfast', thumbnail_url: 'https://images.pexels.com/photos/2739268/pexels-photo-2739268.jpeg?auto=compress&cs=tinysrgb&w=600', is_meal_plan_candidate: 1 },
    { title: 'Stuffed Mushrooms', instructions: 'Stuff mushrooms, bake at 375°F for 20 mins.', category: 'appetizer', thumbnail_url: 'https://images.pexels.com/photos/10359397/pexels-photo-10359397.jpeg?auto=compress&cs=tinysrgb&w=600', is_meal_plan_candidate: 1 },
    { title: 'Grilled Chicken', instructions: 'Grill chicken for 6-8 mins per side.', category: 'entree', thumbnail_url: 'https://www.foodiesfeed.com/wp-content/uploads/ff-images/2025/01/grilled-lemon-herb-chicken-with-fresh-rosemary.png', is_meal_plan_candidate: 1 },
    { title: 'Mashed Potatoes', instructions: 'Boil potatoes, mash with milk and butter.', category: 'side dish', thumbnail_url: 'https://media.istockphoto.com/id/1750526843/photo/creamy-parmesan-polenta.jpg', is_meal_plan_candidate: 1 },
    { title: 'Chocolate Cake', instructions: 'Mix ingredients, bake at 350°F for 30 mins.', category: 'dessert', thumbnail_url: 'https://media.istockphoto.com/id/1370520449/photo/slice-of-chocolate-cake-with-glaze.jpg', is_meal_plan_candidate: 1 },
    { title: 'Trail Mix', instructions: 'Mix all ingredients in a bowl.', category: 'snack', thumbnail_url: 'https://media.istockphoto.com/id/1189549483/photo/jar-of-trail-mix.jpg', is_meal_plan_candidate: 1 },
    { title: 'Pancakes', instructions: 'Mix batter, cook on griddle.', category: 'breakfast', thumbnail_url: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600', is_meal_plan_candidate: 1 },
    { title: 'Bruschetta', instructions: 'Toast bread, top with tomato mix.', category: 'appetizer', thumbnail_url: 'https://www.foodiesfeed.com/wp-content/uploads/ff-images/2025/01/colorful-breakfast-spread-on-a-rustic-plate.png', is_meal_plan_candidate: 1 },
    { title: 'Beef Stew', instructions: 'Simmer all ingredients for 2 hours.', category: 'entree', thumbnail_url: 'https://images.pexels.com/photos/30766452/pexels-photo-30766452/free-photo-of-savory-beef-dish-with-fresh-vegetables.jpeg?auto=compress&cs=tinysrgb&w=600', is_meal_plan_candidate: 1 },
    { title: 'Fruit Salad', instructions: 'Chop fruit, mix together.', category: 'snack', thumbnail_url: 'https://media.istockphoto.com/id/2197322106/photo/fruit-salad.jpg', is_meal_plan_candidate: 1 },
  ];
  recipes.forEach(r => recipesStmt.run(r.title, r.instructions, r.category, r.thumbnail_url, r.is_meal_plan_candidate));
  recipesStmt.finalize();

  // Insert recipe_ingredients
  const recipeIngredientsStmt = db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)');
  const recipeIngredients = [
    // Scrambled Eggs
    { recipeTitle: 'Scrambled Eggs', ingredientName: 'eggs', quantity: '2', unit: '' },
    { recipeTitle: 'Scrambled Eggs', ingredientName: 'milk', quantity: '1', unit: 'tbsp' },
    // Stuffed Mushrooms
    { recipeTitle: 'Stuffed Mushrooms', ingredientName: 'mushrooms', quantity: '10', unit: '' },
    { recipeTitle: 'Stuffed Mushrooms', ingredientName: 'breadcrumbs', quantity: '1/2', unit: 'cup' },
    { recipeTitle: 'Stuffed Mushrooms', ingredientName: 'cheese', quantity: '1/4', unit: 'cup' },
    // Grilled Chicken
    { recipeTitle: 'Grilled Chicken', ingredientName: 'chicken breasts', quantity: '2', unit: '' },
    { recipeTitle: 'Grilled Chicken', ingredientName: 'salt', quantity: '1', unit: 'tsp' },
    { recipeTitle: 'Grilled Chicken', ingredientName: 'pepper', quantity: '1', unit: 'tsp' },
    // Mashed Potatoes
    { recipeTitle: 'Mashed Potatoes', ingredientName: 'potatoes', quantity: '4', unit: '' },
    { recipeTitle: 'Mashed Potatoes', ingredientName: 'milk', quantity: '1/2', unit: 'cup' },
    { recipeTitle: 'Mashed Potatoes', ingredientName: 'butter', quantity: '2', unit: 'tbsp' },
    // Chocolate Cake
    { recipeTitle: 'Chocolate Cake', ingredientName: 'flour', quantity: '2', unit: 'cups' },
    { recipeTitle: 'Chocolate Cake', ingredientName: 'sugar', quantity: '1', unit: 'cup' },
    { recipeTitle: 'Chocolate Cake', ingredientName: 'cocoa', quantity: '1/2', unit: 'cup' },
    // Trail Mix
    { recipeTitle: 'Trail Mix', ingredientName: 'nuts', quantity: '1', unit: 'cup' },
    { recipeTitle: 'Trail Mix', ingredientName: 'raisins', quantity: '1/2', unit: 'cup' },
    { recipeTitle: 'Trail Mix', ingredientName: 'chocolate chips', quantity: '1/2', unit: 'cup' },
    // Pancakes
    { recipeTitle: 'Pancakes', ingredientName: 'flour', quantity: '1', unit: 'cup' },
    { recipeTitle: 'Pancakes', ingredientName: 'eggs', quantity: '1', unit: '' },
    { recipeTitle: 'Pancakes', ingredientName: 'milk', quantity: '1', unit: 'cup' },
    // Bruschetta
    { recipeTitle: 'Bruschetta', ingredientName: 'baguette', quantity: '1', unit: '' },
    { recipeTitle: 'Bruschetta', ingredientName: 'tomatoes', quantity: '2', unit: '' },
    { recipeTitle: 'Bruschetta', ingredientName: 'olive oil', quantity: '1', unit: 'tbsp' },
    // Beef Stew
    { recipeTitle: 'Beef Stew', ingredientName: 'beef', quantity: '1', unit: 'lb' },
    { recipeTitle: 'Beef Stew', ingredientName: 'carrots', quantity: '2', unit: '' },
    { recipeTitle: 'Beef Stew', ingredientName: 'potatoes', quantity: '2', unit: '' },
    // Fruit Salad
    { recipeTitle: 'Fruit Salad', ingredientName: 'apple', quantity: '1', unit: '' },
    { recipeTitle: 'Fruit Salad', ingredientName: 'banana', quantity: '1', unit: '' },
    { recipeTitle: 'Fruit Salad', ingredientName: 'grapes', quantity: '1', unit: 'cup' },
  ];

  db.all('SELECT id, title FROM recipes', (err, recipeRows) => {
    if (err) {
      console.error('Error fetching recipes:', err.message);
      db.close();
      return;
    }
    db.all('SELECT id, name FROM ingredients', (err, ingredientRows) => {
      if (err) {
        console.error('Error fetching ingredients:', err.message);
        db.close();
        return;
      }
      recipeIngredients.forEach(ri => {
        const recipe = recipeRows.find(r => r.title === ri.recipeTitle);
        const ingredient = ingredientRows.find(i => i.name === ri.ingredientName);
        if (recipe && ingredient) {
          recipeIngredientsStmt.run(recipe.id, ingredient.id, ri.quantity, ri.unit || null);
        } else {
          console.warn(`Missing recipe (${ri.recipeTitle}) or ingredient (${ri.ingredientName})`);
        }
      });
      recipeIngredientsStmt.finalize();
      console.log('Database seeded with recipes, ingredients, and relationships.');
      db.close();
    });
  });
});