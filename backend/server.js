const express = require('express');
const cors = require('cors'); // Ensure CORS is imported
const db = require('./database');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Root route for debugging
app.get('/', (req, res) => {
  res.send('Welcome to GrammiesCookbook API. Try /recipes or /meals.');
});

// Get all recipes
app.get('/recipes', (req, res) => {
  db.all('SELECT * FROM recipes', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a new recipe
app.post('/recipes', (req, res) => {
  const { title, ingredients, instructions, category } = req.body;
  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category) VALUES (?, ?, ?, ?)',
    [title, ingredients, instructions, category],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update a recipe (partial update)
app.put('/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, category, is_meal_plan_candidate } = req.body;

  const fields = [];
  const values = [];
  if (title !== undefined) {
    fields.push('title = ?');
    values.push(title);
  }
  if (ingredients !== undefined) {
    fields.push('ingredients = ?');
    values.push(ingredients);
  }
  if (instructions !== undefined) {
    fields.push('instructions = ?');
    values.push(instructions);
  }
  if (category !== undefined) {
    fields.push('category = ?');
    values.push(category);
  }
  if (is_meal_plan_candidate !== undefined) {
    fields.push('is_meal_plan_candidate = ?');
    values.push(is_meal_plan_candidate ? 1 : 0);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields provided to update' });
    return;
  }

  const sql = `UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  db.run(sql, values, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    res.status(200).json({ success: true });
  });
});

// Delete a recipe
app.delete('/recipes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM recipes WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Get all meals
app.get('/meals', (req, res) => {
  db.all(`
    SELECT meals.id, meals.date, recipes.title AS recipe_title
    FROM meals
    JOIN recipes ON meals.recipe_id = recipes.id
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a new meal
app.post('/meals', (req, res) => {
  const { recipe_id, date } = req.body;
  db.run(
    'INSERT INTO meals (recipe_id, date) VALUES (?, ?)',
    [recipe_id, date],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});