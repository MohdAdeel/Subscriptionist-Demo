import React from "react";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Report from "../pages/Reports/Report";
import Vendor from "../pages/Vendors/Vendor";
import NotFound from "../components/NotFound";
import Profile from "../pages/Profile/Profile";
import ProtectedRoutes from "./ProtectedRoutes";
import { Routes, Route } from "react-router-dom";
import Subscription from "../pages/Subscriptions/Subscription";
import UnderConstruction from "../components/UnderConstruction";
function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/vendors" element={<Vendor />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscriptions" element={<Subscription />} />
        <Route path="/mytasks" element={<UnderConstruction title="My Tasks" />} />
        <Route path="/faqs" element={<UnderConstruction title="FAQs" />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
