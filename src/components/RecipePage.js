import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecipePage.css';

function RecipePage() {
  const [recipesByCategory, setRecipesByCategory] = useState({});
  const [openCategories, setOpenCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState([{ quantity: '', unit: '', name: '' }]);
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('breakfast');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/recipes');
      const grouped = response.data.reduce((acc, recipe) => {
        const cat = recipe.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(recipe);
        return acc;
      }, {});

      // Sort recipes within each category by title
      Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => a.title.localeCompare(b.title));
      });

      // Sort categories alphabetically
      const sortedCategories = Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .reduce((acc, cat) => {
          acc[cat] = grouped[cat];
          return acc;
        }, {});

      setRecipesByCategory(sortedCategories);

      // Initialize all categories as open
      const initialOpenState = Object.keys(sortedCategories).reduce((acc, cat) => {
        acc[cat] = true;
        return acc;
      }, {});
      setOpenCategories(initialOpenState);
    } catch (error) {
      console.error('Failed to fetch recipes:', error.message, error.response);
    }
  };

  const addRecipe = async (e) => {
    e.preventDefault();
    const ingredientString = ingredients
      .filter(ing => ing.quantity && ing.name)
      .map(ing => `${ing.quantity} ${ing.unit || ''} ${ing.name}`.trim())
      .join(', ');
    try {
      const response = await axios.post('http://localhost:3000/recipes', {
        title,
        ingredients: ingredientString,
        instructions,
        category,
      });
      if (response.data.success) {
        fetchRecipes();
        closeModal();
      }
    } catch (error) {
      console.error('Error adding recipe:', error.message, error.response);
    }
  };

  const editRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setTitle(recipe.title);
    const parsedIngredients = recipe.ingredients
      ? recipe.ingredients.split(', ').map(ing => {
          const [quantity, ...rest] = ing.split(' ');
          const unit = rest.length > 1 ? rest[0] : '';
          const name = rest.length > 1 ? rest.slice(1).join(' ') : rest.join(' ');
          return { quantity, unit, name };
        })
      : [{ quantity: '', unit: '', name: '' }];
    setIngredients(parsedIngredients);
    setInstructions(recipe.instructions || '');
    setCategory(recipe.category || 'breakfast');
    setIsModalOpen(true);
  };

  const saveRecipe = async (e) => {
    e.preventDefault();
    const ingredientString = ingredients
      .filter(ing => ing.quantity && ing.name)
      .map(ing => `${ing.quantity} ${ing.unit || ''} ${ing.name}`.trim())
      .join(', ');
    try {
      const response = await axios.put(`http://localhost:3000/recipes/${selectedRecipe.id}`, {
        title,
        ingredients: ingredientString,
        instructions,
        category,
      });
      if (response.status === 200) {
        fetchRecipes();
        closeModal();
      }
    } catch (error) {
      console.error('Error updating recipe:', error.message, error.response);
    }
  };

  const deleteRecipe = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/recipes/${id}`);
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error.message, error.response);
    }
  };

  const toggleMealPlanCandidate = async (id, isCandidate) => {
    try {
      await axios.put(`http://localhost:3000/recipes/${id}`, { is_meal_plan_candidate: isCandidate });
      fetchRecipes();
    } catch (error) {
      console.error('Error updating meal plan candidate:', error.message, error.response);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { quantity: '', unit: '', name: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients.length ? newIngredients : [{ quantity: '', unit: '', name: '' }]);
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setTitle('');
    setIngredients([{ quantity: '', unit: '', name: '' }]);
    setInstructions('');
    setCategory('breakfast');
    setSelectedRecipe(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="recipe-page">
      <div className="recipe-header">
        <h2>Recipes</h2>
        <button className="add-recipe-btn" onClick={openModal}>Add Recipe</button>
      </div>
      <div className="recipe-container">
        {Object.entries(recipesByCategory).map(([category, recipes]) => (
          <div key={category} className="category-section">
            <h3 onClick={() => toggleCategory(category)} className="category-title">
              {category}
              <span className="toggle-arrow">
                {openCategories[category] ? '▼' : '▶'}
              </span>
            </h3>
            {openCategories[category] && (
              <div className="recipe-grid">
                {recipes.map(recipe => (
                  <div key={recipe.id} className="recipe-item">
                    <span>{recipe.title}</span>
                    <div className="button-group">
                      <label style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                        <input
                          type="checkbox"
                          checked={recipe.is_meal_plan_candidate || false}
                          onChange={(e) => toggleMealPlanCandidate(recipe.id, e.target.checked)}
                        />
                        <span style={{ marginLeft: '5px' }}>Add to meal plan</span>
                      </label>
                      <button className="edit-btn" onClick={() => editRecipe(recipe)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteRecipe(recipe.id)}>Delete</button>
                    </div>
                    <ul className="ingredient-list">
                      {recipe.ingredients && recipe.ingredients.split(', ').map((ing, idx) => (
                        <li key={idx}>{ing}</li>
                      ))}
                      {recipe.instructions && <li className="instructions">Instructions: {recipe.instructions}</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedRecipe ? 'Edit Recipe' : 'Add Recipe'}</h3>
            <form onSubmit={selectedRecipe ? saveRecipe : addRecipe}>
              <div className="form-section">
                <label>Recipe Name:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-section">
                <label>Ingredients:</label>
                {ingredients.map((ing, index) => (
                  <div key={index} className="ingredient-row">
                    <input
                      type="number"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      placeholder="Quantity"
                      step="0.1"
                    />
                    <input
                      type="text"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      placeholder="Unit (e.g., cups)"
                    />
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="Ingredient"
                      required
                    />
                    <button type="button" className="icon-btn" onClick={() => removeIngredient(index)}>-</button>
                    {index === ingredients.length - 1 && (
                      <button type="button" className="icon-btn" onClick={addIngredient}>+</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="form-section">
                <label>Cooking Instructions:</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter cooking steps..."
                />
              </div>
              <div className="form-section">
                <label>Category:</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="breakfast">Breakfast</option>
                  <option value="appetizer">Appetizer</option>
                  <option value="entree">Entrée</option>
                  <option value="side dish">Side Dish</option>
                  <option value="dessert">Dessert</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="action-btn">{selectedRecipe ? 'Save' : 'Add'}</button>
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipePage;