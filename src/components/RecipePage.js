import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecipePage.css'; // Create this file for styling

function RecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState([{ quantity: '', unit: '', name: '' }, { quantity: '', unit: '', name: '' }]);
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('appetizer');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const response = await axios.get('http://localhost:3000/recipes');
    setRecipes(response.data);
  };

  const addRecipe = async (e) => {
    e.preventDefault();
    const ingredientString = ingredients
      .filter(ing => ing.quantity && ing.name)
      .map(ing => `${ing.quantity} ${ing.unit || ''} ${ing.name}`.trim())
      .join(', ');
    const response = await axios.post('http://localhost:3000/recipes', { title, ingredients: ingredientString, instructions, category });
    if (response.data.success) {
      fetchRecipes();
      closeModal();
    }
  };

  const editRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setTitle(recipe.title);
    setIngredients(recipe.ingredients.map(ing => ({ ...ing })));
    setInstructions(recipe.instructions || '');
    setCategory(recipe.category || 'appetizer');
  };

  const saveRecipe = async () => {
    const ingredientString = ingredients
      .filter(ing => ing.quantity && ing.name)
      .map(ing => `${ing.quantity} ${ing.unit || ''} ${ing.name}`).join(', ');
    const response = await axios.put(`http://localhost:3000/recipes/${selectedRecipe.id}`, {
      title,
      ingredients: ingredientString,
      instructions,
      category,
    });
    if (response.status === 200) {
      fetchRecipes();
      closeModal();
      setSelectedRecipe(null);
    }
  };

  const deleteRecipe = async (id) => {
    await axios.delete(`http://localhost:3000/recipes/${id}`);
    fetchRecipes();
  };

  const addToMealPlan = (recipeId) => {
    console.log(`Added recipe ${recipeId} to meal plan`);
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
    setIngredients([{ quantity: '', unit: '', name: '' }, { quantity: '', unit: '', name: '' }]);
    setInstructions('');
    setCategory('appetizer');
    setSelectedRecipe(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="recipe-page">
      <h2>Recipes</h2>
      <button onClick={openModal}>Add Recipe</button>
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.id}>
            {recipe.title} ({recipe.category})
            <button onClick={() => editRecipe(recipe)}>Edit</button>
            <button onClick={() => deleteRecipe(recipe.id)}>Delete</button>
            <button onClick={() => addToMealPlan(recipe.id)}>Add to Meal Plan</button>
            <ul>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{`${ing.quantity} ${ing.unit} ${ing.name}`}</li>
              ))}
              {recipe.instructions && <li>Instructions: {recipe.instructions}</li>}
            </ul>
          </li>
        ))}
      </ul>

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
                    <button type="button" onClick={() => removeIngredient(index)}>-</button>
                    {index === ingredients.length - 1 && (
                      <button type="button" onClick={addIngredient}>+</button>
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
                  <option value="appetizer">Appetizer</option>
                  <option value="entree">Entrée</option>
                  <option value="side dish">Side Dish</option>
                  <option value="dessert">Dessert</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <button type="submit">{selectedRecipe ? 'Save' : 'Add'}</button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipePage;