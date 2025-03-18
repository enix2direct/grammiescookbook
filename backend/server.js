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

app.get('/recipes', (req, res) => {
  db.all('SELECT * FROM recipes', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/recipes', (req, res) => {
  const { title, ingredients, instructions, category, thumbnail_url } = req.body;
  db.run(
    'INSERT INTO recipes (title, ingredients, instructions, category, thumbnail_url) VALUES (?, ?, ?, ?, ?)',
    [title, ingredients, instructions, category, thumbnail_url || null],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, category, is_meal_plan_candidate, thumbnail_url } = req.body;

  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (ingredients !== undefined) { fields.push('ingredients = ?'); values.push(ingredients); }
  if (instructions !== undefined) { fields.push('instructions = ?'); values.push(instructions); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category); }
  if (is_meal_plan_candidate !== undefined) { fields.push('is_meal_plan_candidate = ?'); values.push(is_meal_plan_candidate ? 1 : 0); }
  if (thumbnail_url !== undefined) { fields.push('thumbnail_url = ?'); values.push(thumbnail_url); }

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

app.get('/meals', (req, res) => {
  db.all(`
    SELECT meals.id, meals.date, recipes.title AS recipe_title, recipes.category
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

app.delete('/meals/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM meals WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    res.json({ success: true });
  });
});

app.get('/meals/week', (req, res) => {
  const { startDate } = req.query; // Expecting YYYY-MM-DD format
  if (!startDate) {
    res.status(400).json({ error: 'Start date is required' });
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End of the week (7 days total)

  db.all(`
    SELECT meals.id, meals.date, recipes.title AS recipe_title, recipes.ingredients, recipes.category
    FROM meals
    JOIN recipes ON meals.recipe_id = recipes.id
    WHERE meals.date BETWEEN ? AND ?
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