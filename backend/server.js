const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to GrammiesCookbook API. Try /recipes or /meals.');
});

// Get all recipes with their ingredients
app.get('/recipes', (req, res) => {
  db.all(`
    SELECT r.*, GROUP_CONCAT(ri.quantity || ' ' || COALESCE(ri.unit || ' ', '') || i.name, ', ') AS ingredients
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    GROUP BY r.id
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a new recipe with ingredients
app.post('/recipes', (req, res) => {
  const { title, ingredients, instructions, category, thumbnail_url } = req.body;
  db.run(
    'INSERT INTO recipes (title, instructions, category, thumbnail_url) VALUES (?, ?, ?, ?)',
    [title, instructions, category, thumbnail_url || null],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const recipeId = this.lastID;
      const ingredientPromises = ingredients.map(ing => {
        return new Promise((resolve, reject) => {
          db.get('SELECT id FROM ingredients WHERE name = ?', [ing.name], (err, row) => {
            if (err) return reject(err);
            if (row) {
              db.run('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
                [recipeId, row.id, ing.quantity, ing.unit || null], resolve);
            } else {
              db.run('INSERT INTO ingredients (name) VALUES (?)', [ing.name], function (err) {
                if (err) return reject(err);
                db.run('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
                  [recipeId, this.lastID, ing.quantity, ing.unit || null], resolve);
              });
            }
          });
        });
      });
      Promise.all(ingredientPromises)
        .then(() => res.json({ success: true, id: recipeId }))
        .catch(err => res.status(500).json({ error: err.message }));
    }
  );
});

// Update a recipe
app.put('/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, category, is_meal_plan_candidate, thumbnail_url } = req.body;

  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (instructions !== undefined) { fields.push('instructions = ?'); values.push(instructions); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category); }
  if (is_meal_plan_candidate !== undefined) { fields.push('is_meal_plan_candidate = ?'); values.push(is_meal_plan_candidate ? 1 : 0); }
  if (thumbnail_url !== undefined) { fields.push('thumbnail_url = ?'); values.push(thumbnail_url); }

  if (fields.length === 0 && !ingredients) {
    res.status(400).json({ error: 'No fields provided to update' });
    return;
  }

  const updateRecipe = () => {
    if (fields.length > 0) {
      const sql = `UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      db.run(sql, values, function (err) {
        if (err) return Promise.reject(err);
        if (this.changes === 0) return Promise.reject(new Error('Recipe not found'));
      });
    }
    return Promise.resolve();
  };

  const updateIngredients = () => {
    if (!ingredients) return Promise.resolve();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id], (err) => {
        if (err) return reject(err);
        const ingredientPromises = ingredients.map(ing => {
          return new Promise((res, rej) => {
            db.get('SELECT id FROM ingredients WHERE name = ?', [ing.name], (err, row) => {
              if (err) return rej(err);
              if (row) {
                db.run('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
                  [id, row.id, ing.quantity, ing.unit || null], res);
              } else {
                db.run('INSERT INTO ingredients (name) VALUES (?)', [ing.name], function (err) {
                  if (err) return rej(err);
                  db.run('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
                    [id, this.lastID, ing.quantity, ing.unit || null], res);
                });
              }
            });
          });
        });
        Promise.all(ingredientPromises).then(resolve).catch(reject);
      });
    });
  };

  Promise.all([updateRecipe(), updateIngredients()])
    .then(() => res.status(200).json({ success: true }))
    .catch(err => {
      if (err.message === 'Recipe not found') res.status(404).json({ error: err.message });
      else res.status(500).json({ error: err.message });
    });
});

// Delete a recipe
app.delete('/recipes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.run('DELETE FROM recipes WHERE id = ?', [id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    });
  });
});

// Get all meals
app.get('/meals', (req, res) => {
  db.all(`
    SELECT meals.id, meals.date, meals.quantity, recipes.title AS recipe_title, recipes.category,
           GROUP_CONCAT(ri.quantity || ' ' || COALESCE(ri.unit || ' ', '') || i.name, ', ') AS ingredients
    FROM meals
    JOIN recipes ON meals.recipe_id = recipes.id
    LEFT JOIN recipe_ingredients ri ON recipes.id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    GROUP BY meals.id, meals.date, meals.quantity, recipes.title, recipes.category
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a meal or increment quantity if it exists
app.post('/meals', (req, res) => {
  const { recipe_id, date } = req.body;
  db.get(
    'SELECT id, quantity FROM meals WHERE recipe_id = ? AND date = ?',
    [recipe_id, date],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (row) {
        // Increment quantity if meal exists
        db.run(
          'UPDATE meals SET quantity = quantity + 1 WHERE id = ?',
          [row.id],
          function (err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ success: true, id: row.id });
          }
        );
      } else {
        // Insert new meal with quantity 1
        db.run(
          'INSERT INTO meals (recipe_id, date, quantity) VALUES (?, ?, 1)',
          [recipe_id, date],
          function (err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ success: true, id: this.lastID });
          }
        );
      }
    }
  );
});

// Update a meal
app.put('/meals/:id', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  db.run('UPDATE meals SET date = ? WHERE id = ?', [date, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    res.status(200).json({ success: true });
  });
});

// Delete a meal or decrement quantity
app.delete('/meals/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT quantity FROM meals WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    if (row.quantity > 1) {
      // Decrement quantity
      db.run('UPDATE meals SET quantity = quantity - 1 WHERE id = ?', [id], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true });
      });
    } else {
      // Delete if quantity is 1
      db.run('DELETE FROM meals WHERE id = ?', [id], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true });
      });
    }
  });
});

// Get meals for a week
app.get('/meals/week', (req, res) => {
  const { startDate } = req.query;
  if (!startDate) {
    res.status(400).json({ error: 'Start date is required' });
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  db.all(`
    SELECT meals.id, meals.date, meals.quantity, recipes.title AS recipe_title, recipes.category,
           GROUP_CONCAT(ri.quantity || ' ' || COALESCE(ri.unit || ' ', '') || i.name, ', ') AS ingredients
    FROM meals
    JOIN recipes ON meals.recipe_id = recipes.id
    LEFT JOIN recipe_ingredients ri ON recipes.id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE meals.date BETWEEN ? AND ?
    GROUP BY meals.id, meals.date, meals.quantity, recipes.title, recipes.category
  `, [start.toISOString().split('T')[0], end.toISOString().split('T')[0]], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});