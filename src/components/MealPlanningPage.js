import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './RecipePage.css';

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
    try {
      const response = await axios.get('http://localhost:3000/meals');
      console.log('Meals fetched:', response.data);
      setMeals(response.data);
    } catch (error) {
      console.error('Failed to fetch meals:', error.message, error.response);
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error('Failed to fetch recipes:', error.message, error.response);
    }
  };

  const handleDateClick = (arg) => {
    if (selectedRecipe && !isModalOpen && arg.dayEl) {
      axios.post('http://localhost:3000/meals', {
        recipe_id: selectedRecipe,
        date: arg.dateStr,
      }).then(() => {
        fetchMeals();
      }).catch(error => {
        console.error('Error adding meal on date click:', error.message, error.response);
      });
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
        fetchMeals();
      } catch (error) {
        console.error('Error adding meal:', error.message, error.response);
      }
    }
  };

  const deleteMeal = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/meals/${id}`);
      fetchMeals();
    } catch (error) {
      console.error('Error deleting meal:', error.message, error.response);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'breakfast': return '#ffcc99'; // Light peach
      case 'appetizer': return '#ff9999'; // Light red
      case 'entree': return '#99cc99'; // Light green
      case 'side dish': return '#cccc99'; // Light olive
      case 'dessert': return '#ff99cc'; // Light pink
      case 'snack': return '#99cccc'; // Light teal
      default: return '#fff5e6'; // Default beige
    }
  };

  const categoryOrder = [
    'breakfast',
    'appetizer',
    'entree',
    'side dish',
    'dessert',
    'snack'
  ];

  const events = meals
    .map(meal => ({
      title: `${meal.recipe_title} `,
      extendedProps: { id: meal.id },
      start: meal.date,
      backgroundColor: getCategoryColor(meal.category),
      borderColor: getCategoryColor(meal.category),
      textColor: '#663300',
      category: meal.category
    }))
    .sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      const orderA = categoryOrder.indexOf(a.category);
      const orderB = categoryOrder.indexOf(b.category);
      console.log(`Sorting ${a.title} (${a.category}, ${orderA}) vs ${b.title} (${b.category}, ${orderB})`);
      return orderA - orderB;
    });

  return (
    <div>
      <h2>Meal Planning</h2>
      <select value={selectedRecipe} onChange={(e) => setSelectedRecipe(e.target.value)}>
        <option value="">Select a Recipe</option>
        {recipes.filter(recipe => recipe.is_meal_plan_candidate).map(recipe => (
          <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
        ))}
      </select>
      <div className="category-legend">
        <span className="legend-item" style={{ backgroundColor: '#ffcc99' }}>Breakfast</span>
        <span className="legend-item" style={{ backgroundColor: '#ff9999' }}>Appetizer</span>
        <span className="legend-item" style={{ backgroundColor: '#99cc99' }}>Entrée</span>
        <span className="legend-item" style={{ backgroundColor: '#cccc99' }}>Side Dish</span>
        <span className="legend-item" style={{ backgroundColor: '#ff99cc' }}>Dessert</span>
        <span className="legend-item" style={{ backgroundColor: '#99cccc' }}>Snack</span>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventContent={(arg) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>{arg.event.title}</span>
            <button
              onClick={() => deleteMeal(arg.event.extendedProps.id)}
              style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0 5px' }}
            >
              x
            </button>
          </div>
        )}
        eventOrder={(a, b) => categoryOrder.indexOf(a.extendedProps.category) - categoryOrder.indexOf(b.extendedProps.category)}
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