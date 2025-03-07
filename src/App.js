import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RecipePage from './components/RecipePage';
import MealPlanningPage from './components/MealPlanningPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App" style={{ maxWidth: '80%', margin: '0 auto' }}>
        <h1>GrammiesCookbook</h1>
        <nav>
          <Link to="/recipes">Recipes</Link> | <Link to="/meal-planning">Meal Planning</Link>
        </nav>
        <Routes>
          <Route path="/" element={<div>Welcome! Choose a page above.</div>} />
          <Route path="/recipes" element={<RecipePage />} />
          <Route path="/meal-planning" element={<MealPlanningPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;