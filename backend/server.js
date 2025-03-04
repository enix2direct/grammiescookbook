const express = require('express');
const app = express();
const db = require('./database.js');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001'); // Allow frontend origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'GrammiesCookbook Backend - API Only. Use /recipes, /meals, etc.' });
});

app.post('/recipes', (req, res) => {
  const recipeTitle = req.body.title;
  const rawIngredients = req.body.ingredients ? req.body.ingredients.split(',').map(i => i.trim()) : [];
  const ingredients = rawIngredients.map(ing => {
    const parts = ing.split(' ').filter(Boolean);
    const quantity = parseFloat(parts[0]) || 0;
    const unit = parts.length > 2 ? parts[1] : '';
    const name = parts.slice(parts.length > 2 ? 2 : 1).join(' ');
    return { quantity, unit, name };
  });
  db.run('INSERT INTO recipes (title) VALUES (?)', [recipeTitle], function(err) {
    if (err) {
      console.log('Error adding recipe:', err);
      return res.status(500).send('Error adding recipe');
    }
    const recipeId = this.lastID;
    if (ingredients.length > 0) {
      const placeholders = ingredients.map(() => '(?, ?, ?, ?)').join(',');
      const values = ingredients.flatMap(ing => [recipeId, ing.quantity, ing.unit, ing.name]);
      db.run(`INSERT INTO ingredients (recipe_id, quantity, unit, name) VALUES ${placeholders}`, values, (err) => {
        if (err) {
          console.log('Error adding ingredients:', err);
          return res.status(500).send('Error adding ingredients');
        }
        res.status(200).json({ id: recipeId, success: true });
      });
    } else {
      res.status(200).json({ id: recipeId, success: true });
    }
  });
});

app.get('/recipes', (req, res) => {
  db.all('SELECT r.id, r.title, i.quantity, i.unit, i.name FROM recipes r LEFT JOIN ingredients i ON r.id = i.recipe_id', (err, rows) => {
    if (err) {
      console.log('Fetch Error:', err);
      return res.status(500).send('Error fetching recipes');
    }
    const recipes = {};
    rows.forEach(row => {
      if (!recipes[row.id]) {
        recipes[row.id] = { id: row.id, title: row.title, ingredients: [] };
      }
      if (row.name) {
        recipes[row.id].ingredients.push({ quantity: row.quantity, unit: row.unit, name: row.name });
      }
    });
    res.json(Object.values(recipes));
  });
});

app.put('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  const { title, ingredients } = req.body;
  const parsedIngredients = ingredients ? ingredients.split(',').map(i => i.trim()).map(ing => {
    const parts = ing.split(' ').filter(Boolean);
    const quantity = parseFloat(parts[0]) || 0;
    const unit = parts.length > 2 ? parts[1] : '';
    const name = parts.slice(parts.length > 2 ? 2 : 1).join(' ');
    return { quantity, unit, name };
  }) : [];
  db.run('UPDATE recipes SET title = ? WHERE id = ?', [title, recipeId], (err) => {
    if (err) {
      console.log('Error updating recipe:', err);
      return res.status(500).send('Error updating recipe');
    }
    db.run('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId], (err) => {
      if (err) {
        console.log('Error deleting old ingredients:', err);
        return res.status(500).send('Error deleting old ingredients');
      }
      if (parsedIngredients.length > 0) {
        const placeholders = parsedIngredients.map(() => '(?, ?, ?, ?)').join(',');
        const values = parsedIngredients.flatMap(ing => [recipeId, ing.quantity, ing.unit, ing.name]);
        db.run(`INSERT INTO ingredients (recipe_id, quantity, unit, name) VALUES ${placeholders}`, values, (err) => {
          if (err) {
            console.log('Error adding new ingredients:', err);
            return res.status(500).send('Error adding new ingredients');
          }
          res.status(200).send('Recipe updated');
        });
      } else {
        res.status(200).send('Recipe updated');
      }
    });
  });
});

app.delete('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  db.run('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId], (err) => {
    if (err) {
      console.log('Error deleting ingredients:', err);
      return res.status(500).send('Error deleting ingredients');
    }
    db.run('DELETE FROM meals WHERE recipe_id = ?', [recipeId], (err) => {
      if (err) {
        console.log('Error deleting meals:', err);
        return res.status(500).send('Error deleting meals');
      }
      db.run('DELETE FROM recipes WHERE id = ?', [recipeId], (err) => {
        if (err) {
          console.log('Error deleting recipe:', err);
          return res.status(500).send('Error deleting recipe');
        }
        res.status(200).send('Recipe deleted');
      });
    });
  });
});

app.post('/meals', (req, res) => {
  const { recipe_id, date } = req.body;
  db.run('INSERT INTO meals (recipe_id, date) VALUES (?, ?)', [recipe_id, date], (err) => {
    if (err) {
      console.log('Error adding meal:', err);
      return res.status(500).send('Error adding meal');
    }
    res.status(200).json({ success: true });
  });
});

app.get('/meals', (req, res) => {
  const { startDate, endDate } = req.query;
  let query = 'SELECT m.id, m.date, r.title AS recipe_title FROM meals m JOIN recipes r ON m.recipe_id = r.id';
  let params = [];
  if (startDate && endDate) {
    query += ' WHERE m.date BETWEEN ? AND ?';
    params = [startDate, endDate];
  }
  db.all(query, params, (err, rows) => {
    if (err) {
      console.log('Fetch Error:', err);
      return res.status(500).send('Error fetching meals');
    }
    res.json(rows);
  });
});

app.listen(3000, () => console.log('Backend running on port 3000'));