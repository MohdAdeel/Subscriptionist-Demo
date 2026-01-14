import "./App.css";
import React from "react";
import Home from "./pages/Home/Home";
import Menu from "./components/menu";
import { Route, Routes } from "react-router-dom";
import Subscription from "./pages/Subscriptions/Subscription";

function App() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Menu />

      {/* Main Content */}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/subscriptions" element={<Subscription />} />
          {/* <Route path="/budget-management" element={<BudgetManagement />} /> */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
