import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatHome from "./pages/ChatHome";
import RecipeDetails from "./pages/RecipeDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Discover from "./pages/Discover";
import Planner from "./pages/Planner";
import Saved from "./pages/Saved";
import NutritionTracker from "./pages/NutritionTracker";
import BudgetPlanner from "./pages/BudgetPlanner";
import RecipeComparison from "./pages/RecipeComparison";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/assistant" element={<AppLayout />}>
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="chat" element={<ChatHome />} />
          <Route path="discover" element={<Discover />} />
          <Route path="planner" element={<Planner />} />
          <Route path="compare" element={<RecipeComparison />} />
          <Route path="tracker" element={<NutritionTracker />} />
          <Route path="budget" element={<BudgetPlanner />} />
          <Route path="saved" element={<Saved />} />
        </Route>
        <Route path="/recipe/:id" element={<RecipeDetails />} />
        <Route path="/saved-foods" element={<Navigate to="/assistant/saved" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/assistant" replace />} />
    </Routes>
  );
}

export default App;
