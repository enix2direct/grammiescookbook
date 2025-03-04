import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
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
    const response = await axios.post('http://localhost:3000/recipes', { title, ingredients });
    if (response.data.success) {
      fetchRecipes();
      setTitle('');
      setIngredients('');
    }
  };

  const editRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setTitle(recipe.title);
    setIngredients(recipe.ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(', '));
  };

  const saveRecipe = async () => {
    const response = await axios.put(`http://localhost:3000/recipes/${selectedRecipe.id}`, {
      title,
      ingredients,
    });
    if (response.status === 200) {
      fetchRecipes();
      setSelectedRecipe(null);
      setTitle('');
      setIngredients('');
    }
  };

  const deleteRecipe = async (id) => {
    await axios.delete(`http://localhost:3000/recipes/${id}`);
    fetchRecipes();
  };

  const addToMealPlan = (recipeId) => {
    console.log(`Added recipe ${recipeId} to meal plan`);
  };

  return (
    <div>
      <h2>Recipes</h2>
      <form onSubmit={addRecipe}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Recipe Name"
        /><br />
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Ingredients (e.g., 2 cups flour, 1 tsp salt)"
        /><br />
        <button type="submit">Add Recipe</button>
        {selectedRecipe && (
          <button onClick={saveRecipe}>Save Changes</button>
        )}
      </form>
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.id}>
            {recipe.title}
            <button onClick={() => editRecipe(recipe)}>Edit</button>
            <button onClick={() => deleteRecipe(recipe.id)}>Delete</button>
            <button onClick={() => addToMealPlan(recipe.id)}>Add to Meal Plan</button>
            <ul>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{`${ing.quantity} ${ing.unit} ${ing.name}`}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecipePage;