import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

function MealPlanningPage() {
  const [meals, setMeals] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');

  useEffect(() => {
    fetchMeals();
    fetchRecipes();
  }, []);

  const fetchMeals = async () => {
    const response = await axios.get('http://localhost:3000/meals');
    setMeals(response.data);
  };

  const fetchRecipes = async () => {
    const response = await axios.get('http://localhost:3000/recipes');
    setRecipes(response.data);
  };

  const handleDateClick = (arg) => {
    if (selectedRecipe) {
      axios.post('http://localhost:3000/meals', {
        recipe_id: selectedRecipe,
        date: arg.dateStr,
      }).then(() => fetchMeals());
    }
  };

  const events = meals.map(meal => ({
    title: meal.recipe_title,
    start: meal.date,
  }));

  return (
    <div>
      <h2>Meal Planning</h2>
      <select value={selectedRecipe} onChange={(e) => setSelectedRecipe(e.target.value)}>
        <option value="">Select a Recipe</option>
        {recipes.map(recipe => (
          <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
        ))}
      </select>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        height="auto"
      />
    </div>
  );
}

export default MealPlanningPage;