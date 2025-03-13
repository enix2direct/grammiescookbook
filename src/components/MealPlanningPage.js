import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { toast, ToastContainer } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';
import './RecipePage.css';

function MealPlanningPage() {
  const [meals, setMeals] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('dayGridMonth');
  const calendarRef = useRef(null);

  useEffect(() => {
    fetchMeals();
    fetchRecipes();
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await axios.get('http://localhost:3000/meals');
      setMeals(response.data);
    } catch (error) {
      toast.error('Failed to fetch meals. Please try again.');
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/recipes');
      setRecipes(response.data);
    } catch (error) {
      toast.error('Failed to fetch recipes. Please try again.');
    }
  };

  const handleDateClick = (arg) => {
    if (selectedRecipe && !isModalOpen && arg.dayEl) {
      axios.post('http://localhost:3000/meals', {
        recipe_id: selectedRecipe.id,
        date: arg.dateStr.split('T')[0],
      }).then(() => {
        fetchMeals();
      }).catch(() => {
        toast.error('Error adding meal.');
      });
    }
  };

  const saveMeal = async () => {
    if (selectedRecipe) {
      try {
        await axios.post('http://localhost:3000/meals', {
          recipe_id: selectedRecipe.id,
          date: selectedDate.toISOString().split('T')[0],
        });
        setIsModalOpen(false);
        fetchMeals();
      } catch (error) {
        toast.error('Error adding meal.');
      }
    }
  };

  const deleteMeal = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/meals/${id}`);
      fetchMeals();
      toast.success('Meal deleted successfully!');
    } catch (error) {
      toast.error('Error deleting meal.');
    }
  };

  const handleEventDrop = async (info) => {
    const { id } = info.event.extendedProps;
    const newDate = info.event.startStr.split('T')[0];
    try {
      await axios.put(`http://localhost:3000/meals/${id}`, { date: newDate });
      fetchMeals();
    } catch (error) {
      toast.error('Error moving meal.');
      info.revert();
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'breakfast': return '#ffcc99';
      case 'appetizer': return '#ff9999';
      case 'entree': return '#99cc99';
      case 'side dish': return '#cccc99';
      case 'dessert': return '#ff99cc';
      case 'snack': return '#99cccc';
      default: return '#fff5e6';
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
      extendedProps: { id: meal.id, category: meal.category },
      start: meal.date,
      backgroundColor: getCategoryColor(meal.category),
      borderColor: getCategoryColor(meal.category),
      textColor: '#663300',
    }))
    .sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return categoryOrder.indexOf(a.extendedProps.category) - categoryOrder.indexOf(b.extendedProps.category);
    });

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(selectedRecipe && selectedRecipe.id === recipe.id ? null : recipe);
  };

  const handleViewChange = (newView) => {
    setViewMode(newView);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
    }
  };

  const groupedRecipes = categoryOrder.reduce((acc, category) => {
    acc[category] = recipes.filter(recipe => recipe.is_meal_plan_candidate && recipe.category === category);
    return acc;
  }, {});

  return (
    <div>
      <h2>Meal Planning</h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => handleViewChange('dayGridMonth')} className={viewMode === 'dayGridMonth' ? 'action-btn' : 'cancel-btn'}>
          Month View
        </button>
        <button onClick={() => handleViewChange('dayGridWeek')} className={viewMode === 'dayGridWeek' ? 'action-btn' : 'cancel-btn'} style={{ marginLeft: '10px' }}>
          Week View
        </button>
      </div>
      {viewMode === 'dayGridMonth' && (
        <select value={selectedRecipe ? selectedRecipe.id : ''} onChange={(e) => {
          const recipe = recipes.find(r => r.id === parseInt(e.target.value));
          setSelectedRecipe(recipe || null);
        }}>
          <option value="">Select a Recipe</option>
          {recipes.filter(recipe => recipe.is_meal_plan_candidate).map(recipe => (
            <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
          ))}
        </select>
      )}
      <div className="category-legend">
        <span className="legend-item" style={{ backgroundColor: '#ffcc99' }}>Breakfast</span>
        <span className="legend-item" style={{ backgroundColor: '#ff9999' }}>Appetizer</span>
        <span className="legend-item" style={{ backgroundColor: '#99cc99' }}>Entrée</span>
        <span className="legend-item" style={{ backgroundColor: '#cccc99' }}>Side Dish</span>
        <span className="legend-item" style={{ backgroundColor: '#ff99cc' }}>Dessert</span>
        <span className="legend-item" style={{ backgroundColor: '#99cccc' }}>Snack</span>
      </div>
      <FullCalendar
        ref={calendarRef}
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
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: ''
        }}
        height="auto"
        editable={true}
        eventDrop={handleEventDrop}
      />
      {viewMode === 'dayGridWeek' && (
        <div className="recipe-boxes">
          {categoryOrder.map(category => {
            const categoryRecipes = groupedRecipes[category];
            if (!categoryRecipes || categoryRecipes.length === 0) return null;
            return (
              <div
                key={category}
                className="recipe-box"
                style={{ backgroundColor: getCategoryColor(category) }}
              >
                <strong>{category.charAt(0).toUpperCase() + category.slice(1)}</strong>
                {categoryRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    className={`recipe-item ${selectedRecipe && selectedRecipe.id === recipe.id ? 'selected' : ''}`}
                    onClick={() => handleRecipeClick(recipe)}
                  >
                    {recipe.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
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
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default MealPlanningPage;