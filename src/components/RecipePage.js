import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import './RecipePage.css';

function RecipePage() {
  const [recipesByCategory, setRecipesByCategory] = useState({});
  const [openCategories, setOpenCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState([{ quantity: '', unit: '', name: '' }]);
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('breakfast');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categoryOrder = ['breakfast', 'appetizer', 'entree', 'side dish', 'dessert', 'snack'];

  // List of common units to distinguish from ingredient names
  const commonUnits = [
    'cup', 'cups', 'tbsp', 'tablespoon', 'tsp', 'teaspoon', 'oz', 'ounce', 'ounces',
    'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'pinch', 'dash'
  ];

  useEffect(() => {
    fetchRecipes();
  }, [searchQuery]);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/recipes');
      const grouped = response.data.reduce((acc, recipe) => {
        const cat = recipe.category?.toLowerCase() || 'uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          ...recipe,
          ingredients: recipe.ingredients || ''
        });
        return acc;
      }, {});

      const filtered = {};
      Object.keys(grouped).forEach(cat => {
        filtered[cat] = grouped[cat].filter(recipe =>
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.ingredients.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });

      const orderedCategories = {};
      categoryOrder.forEach(cat => {
        if (filtered[cat]?.length) orderedCategories[cat] = filtered[cat];
      });
      Object.keys(filtered).forEach(cat => {
        if (!categoryOrder.includes(cat) && filtered[cat]?.length) {
          orderedCategories[cat] = filtered[cat];
        }
      });

      Object.keys(orderedCategories).forEach(cat => {
        orderedCategories[cat].sort((a, b) => a.title.localeCompare(b.title));
      });

      setRecipesByCategory(orderedCategories);

      const initialOpenState = Object.keys(orderedCategories).reduce((acc, cat) => {
        acc[cat] = true;
        return acc;
      }, {});
      setOpenCategories(initialOpenState);
    } catch (error) {
      toast.error('Failed to fetch recipes. Please try again.');
    }
  };

  const validateThumbnail = async (url) => {
    if (!url) return true;
    try {
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');
      return response.ok && contentType?.startsWith('image/');
    } catch {
      return false;
    }
  };

  const addRecipe = async (e) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(ing => ing.quantity && ing.name);
    if (!validIngredients.length) {
      toast.error('At least one ingredient with quantity and name is required.');
      return;
    }
    if (!(await validateThumbnail(thumbnailUrl))) {
      toast.error('Invalid thumbnail URL. Please provide a valid image URL.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/recipes', {
        title,
        ingredients: validIngredients,
        instructions,
        category,
        thumbnail_url: thumbnailUrl || null,
      });
      if (response.data.success) {
        fetchRecipes();
        closeModal();
        toast.success('Recipe added successfully!');
      }
    } catch (error) {
      toast.error('Error adding recipe. Please try again.');
    }
  };

  const editRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setTitle(recipe.title);
    const parsedIngredients = recipe.ingredients && recipe.ingredients !== ''
      ? recipe.ingredients.split(', ').map(ing => {
          // Match quantity (including fractions), optional unit, and name
          const parts = ing.match(/(\d*\.?\d*\s*\d*\/\d*|\d+)\s*(\w*)\s*(.*)/) || [ing, '', '', ing];
          let quantity = parts[1] || '';
          let unitOrName = parts[2] || '';
          let remainingName = parts[3] || '';

          // Determine if unitOrName is a unit or part of the name
          if (unitOrName && commonUnits.includes(unitOrName.toLowerCase())) {
            return {
              quantity: quantity,
              unit: unitOrName,
              name: remainingName.trim() || ''
            };
          } else {
            // If no unit, everything after quantity is the name
            const name = (unitOrName + ' ' + remainingName).trim();
            return {
              quantity: quantity,
              unit: '',
              name: name || ing.trim() // Fallback to full string if no quantity
            };
          }
        })
      : [{ quantity: '', unit: '', name: '' }];
    setIngredients(parsedIngredients);
    setInstructions(recipe.instructions || '');
    setCategory(recipe.category || 'breakfast');
    setThumbnailUrl(recipe.thumbnail_url || '');
    setIsModalOpen(true);
  };

  const saveRecipe = async (e) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(ing => ing.quantity && ing.name);
    if (!validIngredients.length) {
      toast.error('At least one ingredient with quantity and name is required.');
      return;
    }
    if (!(await validateThumbnail(thumbnailUrl))) {
      toast.error('Invalid thumbnail URL. Please provide a valid image URL.');
      return;
    }
    try {
      const response = await axios.put(`http://localhost:3000/recipes/${selectedRecipe.id}`, {
        title,
        ingredients: validIngredients,
        instructions,
        category,
        thumbnail_url: thumbnailUrl || null,
      });
      if (response.status === 200) {
        fetchRecipes();
        closeModal();
        toast.success('Recipe updated successfully!');
      }
    } catch (error) {
      toast.error('Error updating recipe. Please try again.');
    }
  };

  const deleteRecipe = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`http://localhost:3000/recipes/${id}`);
        fetchRecipes();
        toast.success('Recipe deleted successfully!');
      } catch (error) {
        toast.error('Error deleting recipe. Please try again.');
      }
    }
  };

  const toggleMealPlanCandidate = async (id, isCandidate) => {
    try {
      await axios.put(`http://localhost:3000/recipes/${id}`, { is_meal_plan_candidate: isCandidate });
      fetchRecipes();
      toast.success('Meal plan status updated!');
    } catch (error) {
      toast.error('Error updating meal plan status.');
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
    setThumbnailUrl('');
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
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', borderRadius: '3px', border: '1px solid #e6d9c2' }}
        />
        <button className="add-recipe-btn" onClick={openModal}>Add Recipe</button>
      </div>
      <div className="recipe-container">
        {Object.entries(recipesByCategory).map(([category, recipes]) => (
          <div key={category} className="category-section">
            <h3 onClick={() => toggleCategory(category)} className="category-title">
              {category.charAt(0).toUpperCase() + category.slice(1)}
              <span className="toggle-arrow">
                {openCategories[category] ? '▼' : '▶'}
              </span>
            </h3>
            {openCategories[category] && (
              <div className="recipe-grid">
                {recipes.map(recipe => (
                  <div key={recipe.id} className="recipe-item">
                    <span className="recipe-title">{recipe.title}</span>
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
                    <div className="thumbnail-wrapper">
                      {recipe.thumbnail_url && (
                        <img src={recipe.thumbnail_url} alt={recipe.title} className="recipe-thumbnail" />
                      )}
                    </div>
                    <div className="recipe-content">
                      <ul className="ingredient-list">
                        {recipe.ingredients && typeof recipe.ingredients === 'string' && recipe.ingredients !== ''
                          ? recipe.ingredients.split(', ').map((ing, idx) => (
                              <li key={idx}>{ing}</li>
                            ))
                          : <li>No ingredients listed</li>}
                        {recipe.instructions && <li className="instructions">Instructions: {recipe.instructions}</li>}
                      </ul>
                    </div>
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
                      type="text"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      placeholder="Quantity (e.g., 1 1/2)"
                      required
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
              <div className="form-section">
                <label>Thumbnail URL (optional):</label>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="action-btn">{selectedRecipe ? 'Save' : 'Add'}</button>
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default RecipePage;