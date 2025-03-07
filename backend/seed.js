const db = require('./database');

db.serialize(() => {
  // Clear existing data
  db.run('DELETE FROM recipes');
  db.run('DELETE FROM meals');

  // Insert 10 recipes
  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Scrambled Eggs', '2 eggs, 1 tbsp milk', 'Whisk eggs with milk, cook in pan', 'breakfast', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Tomato Soup', '1 can tomatoes, 1 cup broth', 'Simmer tomatoes and broth, blend', 'soup', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Grilled Cheese', '2 slices bread, 1 slice cheese, 1 tbsp butter', 'Butter bread, add cheese, grill', 'lunch', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Pasta', '200g spaghetti, 1 cup marinara', 'Boil pasta, mix with sauce', 'dinner', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Fruit Salad', '1 apple, 1 banana, 1 orange', 'Chop fruits, mix together', 'dessert', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Oatmeal', '1 cup oats, 2 cups water', 'Boil water, add oats, cook', 'breakfast', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Tuna Salad', '1 can tuna, 2 tbsp mayo, 1 celery stalk', 'Mix tuna, mayo, and chopped celery', 'lunch', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Roasted Veggies', '1 carrot, 1 zucchini, 1 tbsp oil, 1 tsp salt', 'Chop veggies, toss with oil and salt, roast', 'side dish', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Peanut Butter Toast', '1 slice bread, 1 tbsp peanut butter', 'Toast bread, spread peanut butter', 'snack', 0],
    (err) => { if (err) console.error(err); }
  );

  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, is_meal_plan_candidate) VALUES (?, ?, ?, ?, ?)',
    ['Chocolate Milk', '1 cup milk, 1 tbsp cocoa', 'Mix milk and cocoa, stir well', 'dessert', 0],
    (err) => { if (err) console.error(err); }
  );

  console.log('Database seeded with 10 recipes.');
});

db.close();