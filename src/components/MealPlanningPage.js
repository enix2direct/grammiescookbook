import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './RecipePage.css'; // Import RecipePage.css for modal styling

function MealPlanningPage() {
  const [meals, setMeals] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    // Only add meal if no modal is open and a date is explicitly clicked
    if (selectedRecipe && !isModalOpen && arg.dayEl) {
      axios.post('http://localhost:3000/meals', {
        recipe_id: selectedRecipe,
        date: arg.dateStr,
      }).then(() => {
        fetchMeals();
        setSelectedRecipe(''); // Clear selection after adding
      });
    }
  };

  const addToMealPlan = (e) => {
    e.stopPropagation(); // Prevent click from bubbling to calendar
    if (selectedRecipe) {
      setIsModalOpen(true);
    }
  };

  const saveMeal = async () => {
    if (selectedRecipe) {
      try {
        await axios.post('http://localhost:3000/meals', {
          recipe_id: selectedRecipe,
          date: selectedDate.toISOString().split('T')[0],
        });
        setIsModalOpen(false);
        setSelectedRecipe('');
        fetchMeals();
      } catch (error) {
        console.error('Error adding meal:', error);
      }
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
        {recipes.filter(recipe => recipe.is_meal_plan_candidate).map(recipe => (
          <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
        ))}
      </select>
      <button onClick={addToMealPlan} disabled={!selectedRecipe} className="add-recipe-btn">
        Add to Meal Plan
      </button>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        height="auto"
      />

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add to Meal Plan</h3>
            <div className="form-section">
              <label>Select Date:</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="datepicker"
              />
            </div>
            <div className="form-buttons" style={{ marginTop: '20px' }}>
              <button onClick={saveMeal} className="action-btn">Save</button>
              <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlanningPage;