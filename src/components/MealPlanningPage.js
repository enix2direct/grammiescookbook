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
  const [groceryList, setGroceryList] = useState(null); // New state for grocery list
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

  // New function to generate grocery list
  const generateGroceryList = async () => {
    const calendarApi = calendarRef.current.getApi();
    const startDate = calendarApi.view.activeStart; // Get the start of the current view
    try {
      const response = await axios.get('http://localhost:3000/meals/week', {
        params: { startDate: startDate.toISOString().split('T')[0] },
      });
      const weeklyMeals = response.data;

      // Parse and combine ingredients
      const ingredientMap = {};
      weeklyMeals.forEach(meal => {
        const ingredients = meal.ingredients.split(', ').map(ing => {
          const match = ing.match(/(\d*\.?\d*\s*\d*\/\d*|\d+)\s*(\w*)\s*(.*)/) || ['', '', '', ing];
          return { quantity: match[1] || '', unit: match[2] || '', name: match[3] || '' };
        });
        ingredients.forEach(({ quantity, unit, name }) => {
          if (!name) return;
          const key = `${name.trim()}|${unit.trim()}`; // Unique key per ingredient-unit pair
          if (!ingredientMap[key]) {
            ingredientMap[key] = { name: name.trim(), unit: unit.trim(), quantity: 0 };
          }
          const qty = parseFraction(quantity);
          if (!isNaN(qty)) {
            ingredientMap[key].quantity += qty;
          }
        });
      });

      // Convert to array and format
      const combinedList = Object.values(ingredientMap).map(item => ({
        ...item,
        quantity: formatQuantity(item.quantity),
      }));
      setGroceryList(combinedList);
    } catch (error) {
      toast.error('Failed to generate grocery list.');
    }
  };

  // Helper to parse fractions like "1 1/2" or "1/2"
  const parseFraction = (str) => {
    if (!str) return 0;
    const parts = str.trim().split(' ');
    let total = 0;
    parts.forEach(part => {
      if (part.includes('/')) {
        const [num, denom] = part.split('/').map(Number);
        total += num / denom;
      } else {
        total += Number(part);
      }
    });
    return total;
  };

  // Helper to format quantity back to string
  const formatQuantity = (num) => {
    if (num === Math.floor(num)) return num.toString();
    const whole = Math.floor(num);
    const fraction = num - whole;
    if (fraction === 0.5) return whole ? `${whole} 1/2` : '1/2';
    return num.toFixed(2).replace(/\.?0+$/, ''); // Simple decimal formatting
  };

  const handleDateClick = (arg) => {
    if (selectedRecipe && !isModalOpen && arg.dayEl) {
      axios.post('http://localhost:3000/meals', {
        recipe_id: selectedRecipe.id,
        date: arg.dateStr.split('T')[0],
      }).then(() => {
        fetchMeals(); // Refresh meals to update calendar
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

  // Group recipes by category, only including those with is_meal_plan_candidate = 1
  const groupedRecipes = categoryOrder.reduce((acc, category) => {
    acc[category] = recipes.filter(recipe => 
      recipe.category === category && recipe.is_meal_plan_candidate === 1
    );
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
        <button onClick={generateGroceryList} className="action-btn" style={{ marginLeft: '10px' }}>
          Generate Grocery List
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
            <span style={{ fontSize: '11px', margin: 0 }}>{arg.event.title}</span>
            <button
              onClick={() => deleteMeal(arg.event.extendedProps.id)}
              style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0 2px', fontSize: '10px' }}
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
        contentHeight="auto" // Ensure calendar height adjusts to content
        eventMinHeight={12} // Reduced to make events more compact
        eventBorderOverlap={false} // Prevent extra spacing from borders
        forceEventDuration={true} // Ensure events render with minimal height
        editable={true}
        eventDrop={handleEventDrop}
      />
      {viewMode === 'dayGridWeek' && (
        <div className="recipe-boxes">
          {categoryOrder.map(category => {
            const categoryRecipes = groupedRecipes[category];
            if (!categoryRecipes || categoryRecipes.length === 0) return null;
            const boxHeight = Math.max(100, 30 + categoryRecipes.length * 25);
            return (
              <div
                key={category}
                className="recipe-box"
                style={{
                  backgroundColor: getCategoryColor(category),
                  padding: '15px',
                  borderRadius: '5px',
                  width: '200px',
                  height: `${boxHeight}px`,
                  overflowY: 'auto',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '10px', color: '#663300' }}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </strong>
                {categoryRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    className={`meal-item ${selectedRecipe && selectedRecipe.id === recipe.id ? 'selected' : ''}`}
                    onClick={() => handleRecipeClick(recipe)}
                    style={{
                      padding: '5px',
                      cursor: 'pointer',
                      backgroundColor: selectedRecipe && selectedRecipe.id === recipe.id ? 'rgba(255,255,255,0.3)' : 'transparent',
                      borderRadius: '3px',
                      marginBottom: '5px',
                      color: '#663300',
                    }}
                  >
                    {recipe.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {groceryList && (
        <div className="grocery-list" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff5e6', borderRadius: '5px' }}>
          <h3>Grocery List for the Week</h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            {groceryList.map((item, index) => (
              <li key={index} style={{ color: '#663300' }}>
                {item.quantity} {item.unit} {item.name}
              </li>
            ))}
          </ul>
          <button onClick={() => setGroceryList(null)} className="cancel-btn" style={{ marginTop: '10px' }}>
            Close
          </button>
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