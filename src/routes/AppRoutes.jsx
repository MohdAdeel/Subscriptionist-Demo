import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Subscription from "../pages/Subscriptions/Subscription";
import Report from "../pages/Reports/Report";
import Vendor from "../pages/Vendors/Vendor";
import Login from "../pages/Login/Login";
import ProtectedRoutes from "./ProtectedRoutes";
import BudgetManagement from "../pages/Subscriptions/BudgetManagement";
import Profile from "../pages/Profile/Profile";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/subscriptions" element={<Subscription />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/vendors" element={<Vendor />} />
        <Route path="/profile" element={<Profile />} />
        {/* <Route path="/budget-management" element={<BudgetManagement />} /> */}
      </Route>
    </Routes>
  );
}

export default AppRoutes;
