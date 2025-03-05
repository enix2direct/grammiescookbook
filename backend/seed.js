const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('recipes.db');

db.serialize(() => {
  // Insert 5 test recipes
  const recipes = [
    {
      title: 'Spaghetti',
      ingredients: '2 cups pasta, 1 cup tomato sauce',
      instructions: 'Boil pasta, mix with sauce, serve.',
      category: 'entree',
    },
    {
      title: 'Caesar Salad',
      ingredients: '1 cup lettuce, 2 tbsp dressing',
      instructions: 'Toss lettuce with dressing, add croutons.',
      category: 'appetizer',
    },
    {
      title: 'Mashed Potatoes',
      ingredients: '3 cups potatoes, 2 tbsp butter',
      instructions: 'Boil potatoes, mash with butter, season.',
      category: 'side dish',
    },
    {
      title: 'Chocolate Cake',
      ingredients: '2 cups flour, 1 cup sugar, 2 eggs',
      instructions: 'Mix ingredients, bake at 350°F for 30 mins.',
      category: 'dessert',
    },
    {
      title: 'Trail Mix',
      ingredients: '1 cup nuts, 0.5 cup raisins',
      instructions: 'Combine nuts and raisins, serve.',
      category: 'snack',
    },
  ];

  let recipeCount = 0;

  recipes.forEach(recipe => {
    db.run(
      'INSERT INTO recipes (title, instructions, category) VALUES (?, ?, ?)',
      [recipe.title, recipe.instructions, recipe.category],
      function(err) {
        if (err) {
          console.log(`Error adding ${recipe.title}:`, err);
        } else {
          const recipeId = this.lastID;
          const ingredients = recipe.ingredients.split(',').map(i => i.trim());
          const parsedIngredients = ingredients.map(ing => {
            const parts = ing.split(' ').filter(Boolean);
            const quantity = parseFloat(parts[0]) || 0;
            const unit = parts.length > 2 ? parts[1] : '';
            const name = parts.slice(parts.length > 2 ? 2 : 1).join(' ');
            return { quantity, unit, name };
          });
          if (parsedIngredients.length > 0) {
            const placeholders = parsedIngredients.map(() => '(?, ?, ?, ?)').join(',');
            const values = parsedIngredients.flatMap(ing => [recipeId, ing.quantity, ing.unit, ing.name]);
            db.run(`INSERT INTO ingredients (recipe_id, quantity, unit, name) VALUES ${placeholders}`, values, (err) => {
              if (err) console.log(`Error adding ingredients for ${recipe.title}:`, err);
            });
          }
          recipeCount++;
          if (recipeCount === recipes.length) {
            db.close((err) => {
              if (err) console.log('Error closing database:', err);
              console.log('Seeding completed successfully');
            });
          }
        }
      }
    );
  });
});